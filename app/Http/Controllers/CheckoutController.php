<?php
// app/Http/Controllers/CheckoutController.php
namespace App\Http\Controllers;

use App\Http\Requests\CheckoutReviewRequest;
use App\Models\{Cart, Order, OrderItem, Address, DailyCustomer, WorkingGroup, User, OrderEvent};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use App\Mail\OrderPlacedCustomer;
use App\Mail\OrderPlacedAdmin;
use App\Notifications\OrderPlacedAdminDb;
use Illuminate\Support\Facades\Auth;

class CheckoutController extends Controller
{
    public function review(CheckoutReviewRequest $request)
    {
        return $this->checkoutReview($request);
    }

    public function checkoutReview(CheckoutReviewRequest $request)
    {
        // 1) Recalculate totals from cart, ignore client totals
        $cart = Cart::forRequest($request)->loadMissing(['items.product', 'items.design', 'addresses']);
        if ($cart->items->isEmpty()) {
            return back()->withErrors(['cart' => 'Your cart is empty.']);
        }

        $pricing = $cart->recalculateTotals();

        // 2) Resolve addresses matching schema columns
        $bill = [
            'line1'        => $request->billing_address_line1,
            'line2'        => $request->billing_address_line2,
            'city'         => $request->billing_city,
            'region'       => $request->billing_province,
            'postal_code'  => $request->billing_postal,
            'country'      => 'LK',
            'type'         => 'billing',
        ];
        $ship = $request->boolean('shipping_same_as_billing')
            ? array_merge($bill, ['type' => 'shipping'])
            : [
                'line1'        => $request->shipping_address_line1,
                'line2'        => $request->shipping_address_line2,
                'city'         => $request->shipping_city,
                'region'       => $request->shipping_province,
                'postal_code'  => $request->shipping_postal,
                'country'      => 'LK',
                'type'         => 'shipping',
            ];

        // 3) Customer entity resolution
        [$customerType, $customerId, $workingGroupId] = $this->resolveCustomer($request, $bill);

        $order = null;
        DB::transaction(function () use ($request, $cart, $pricing, $bill, $ship, $customerType, $customerId, $workingGroupId, &$order) {
            $order = Order::create([
                'user_id'             => Auth::id(),
                'customer_type'       => $customerType,
                'customer_id'         => $customerId,
                'working_group_id'    => $workingGroupId,
                'status'              => 'pending',
                'subtotal_amount'     => $pricing->subtotal,
                'discount_amount'     => $pricing->discount,
                'shipping_amount'     => $pricing->shipping,
                'tax_amount'          => $pricing->tax,
                'total_amount'        => $pricing->grand,
                'shipping_method_id'  => $request->shipping_method_id,
                'is_company'          => (bool) $request->boolean('is_company'),
                'company_name'        => $request->company_name,
                'notes'               => $request->notes,
                'contact_first_name'  => $request->first_name,
                'contact_last_name'   => $request->last_name,
                'contact_email'       => $request->email,
                'contact_phone'       => $request->phone_primary,
                'contact_whatsapp'    => $request->whatsapp,
                'phone_alt_1'         => $request->phone_alt_1,
                'phone_alt_2'         => $request->phone_alt_2,
                'created_by'          => Auth::id(),
            ]);

            // Addresses
            $billAddr = Address::create(array_merge($bill, [
                'addressable_type' => Order::class,
                'addressable_id'   => $order->id,
            ]));
            $shipAddr = Address::create(array_merge($ship, [
                'addressable_type' => Order::class,
                'addressable_id'   => $order->id,
            ]));

            $order->forceFill([
                'billing_address_id'  => $billAddr->id,
                'shipping_address_id' => $shipAddr->id,
            ])->save();

            foreach ($cart->items as $ci) {
                OrderItem::create([
                    'order_id'               => $order->id,
                    'product_id'             => $ci->product_id,
                    'variant_id'             => $ci->variant_id,
                    'subvariant_id'          => $ci->subvariant_id,
                    'name'                   => $ci->product_name ?? optional($ci->product)->name,
                    'description'            => data_get($ci->meta, 'description'),
                    'pricing_method'         => $ci->pricing_method,
                    'size_unit'              => $ci->size_unit,
                    'width'                  => $ci->width,
                    'height'                 => $ci->height,
                    'quantity'               => $ci->quantity,
                    'unit_price'             => $ci->unit_price,
                    'line_total'             => $ci->total_price,
                    'options'                => $ci->options ?: $ci->selected_options,
                    'design_id'              => $ci->design_id,
                    'user_design_upload_id'  => $ci->user_design_upload_id,
                    'hire_designer'          => (bool) data_get($ci->meta, 'hire_designer', false),
                ]);
            }

            $cart->clear();
        });

        if ($order) {
            $order->recordStatusChange($order->status, [
                'old_status' => null,
                'visibility' => OrderEvent::VISIBILITY_CUSTOMER,
                'message'    => 'Order submitted via website checkout.',
                'created_by' => Auth::id(),
            ]);
        } else {
            return back()->withErrors(['order' => 'Order creation failed. Please try again.']);
        }

        // 5) Notify admins + customer (queued)
        $notifyEmails = $this->notifyEmails();
        if (!empty($notifyEmails)) {
            Mail::to($notifyEmails)->queue(new OrderPlacedAdmin($order->fresh('items')));
        } else {
            $admins = User::where('is_admin', true)->get();
            Notification::send($admins, new OrderPlacedAdminDb($order));
        }
        if (!empty($order->contact_email)) {
            Mail::to($order->contact_email)->queue(new OrderPlacedCustomer($order));
        }

        return redirect()->route('orders.thankyou', $order);
    }

    public function thankyou(Order $order)
    {
        $order->load([
            'items.product.images',
            'items.variant',
            'items.subvariant',
            'shippingAddress',
            'billingAddress',
            'shippingMethod',
        ]);

        $contactName = trim(collect([
            $order->contact_first_name,
            $order->contact_last_name,
        ])->filter()->implode(' '));

        $orderNumber = $order->number ?? sprintf('ORD-%05d', $order->id);

        $items = $order->items->map(function (OrderItem $item) {
            $qty = (int) ($item->quantity ?? 1);
            $unit = (float) ($item->unit_price ?? 0);
            $line = (float) ($item->line_total ?? $qty * $unit);

            // Get primary image or first image
            $imageUrl = null;
            if ($item->product && $item->product->images) {
                $primaryImage = $item->product->images
                    ->sortBy([
                        ['is_primary', 'desc'],
                        ['image_order', 'asc'],
                        ['id', 'asc'],
                    ])
                    ->first();
                $imageUrl = $primaryImage ? $primaryImage->image_url : null;
            }

            return [
                'id'         => $item->id,
                'name'       => $item->name ?? optional($item->product)->name,
                'sku'        => optional($item->product)->sku,
                'qty'        => $qty,
                'unit_price' => $unit,
                'line_total' => $line,
                'variant'    => $item->description
                    ?: optional($item->variant)->name
                    ?: optional($item->subvariant)->name,
                'image_url'  => $imageUrl,
            ];
        })->values()->all();

        $shippingAddress = $order->shippingAddress
            ? [
                'name'        => $contactName ?: null,
                'line1'       => $order->shippingAddress->line1,
                'line2'       => $order->shippingAddress->line2,
                'city'        => $order->shippingAddress->city,
                'state'       => $order->shippingAddress->region,
                'postal_code' => $order->shippingAddress->postal_code,
                'country'     => $order->shippingAddress->country,
                'phone'       => $order->contact_phone ?? $order->contact_whatsapp,
            ]
            : null;

        $payload = [
            'id'                 => $order->id,
            'number'             => $orderNumber,
            'status'             => $order->status,
            'payment_status'     => $order->payment_status ?? null,
            'shipping_method'    => optional($order->shippingMethod)->name,
            'eta'                => optional($order->shippingMethod)->estimated_eta ?? null,
            'currency'           => 'LKR',
            'email'              => $order->contact_email,
            'contact_first_name' => $order->contact_first_name,
            'contact_last_name'  => $order->contact_last_name,
            'subtotal'           => (float) ($order->subtotal_amount ?? 0),
            'discount'           => abs((float) ($order->discount_amount ?? 0)),
            'shipping'           => (float) ($order->shipping_amount ?? 0),
            'tax'                => (float) ($order->tax_amount ?? 0),
            'total'              => (float) ($order->total_amount ?? $order->grand_total ?? 0),
            'items'              => $items,
            'shipping_address'   => $shippingAddress,
        ];

        $links = [
            'continue_shopping' => route('products.all'),
            'contact'           => route('requests.create'),
        ];

        return inertia('ThankYou', [
            'order'   => $payload,
            'links'   => $links,
            'message' => 'Thanks! Our team will review your order and share a payment link shortly.',
        ]);
    }

    /** Resolve customer (logged-in -> user; guest -> daily_customers). */
    protected function resolveCustomer(Request $r, array $billingAddress): array
    {
        $defaultGroup = WorkingGroup::query()->orderBy('id')->value('id');

        if (Auth::check()) {
            $user = Auth::user();
            return [User::class, $user->getAuthIdentifier(), $user->working_group_id ?? $defaultGroup];
        }

        $email = $r->email;
        $dc = $email ? DailyCustomer::where('email', $email)->first() : null;
        $fullName = trim($r->first_name . ' ' . $r->last_name);

        if (!$dc) {
            $groupId = WorkingGroup::query()->orderBy('id')->value('id');
            $notes = collect([
                $r->notes,
                $r->whatsapp ? 'WhatsApp: ' . $r->whatsapp : null,
            ])->filter()->implode(PHP_EOL);
            $dc = DailyCustomer::create([
                'full_name'        => $fullName !== '' ? $fullName : 'Guest customer',
                'phone_number'     => $r->phone_primary,
                'email'            => $email,
                'address'          => $this->formatAddressForNotes($billingAddress),
                'notes'            => $notes,
                'visit_date'       => now()->toDateString(),
                'working_group_id' => $groupId,
            ]);
        } else {
            $updates = [
                'full_name'    => $fullName !== '' ? $fullName : $dc->full_name,
                'phone_number' => $r->phone_primary ?? $dc->phone_number,
            ];

            if (!$dc->address) {
                $updates['address'] = $this->formatAddressForNotes($billingAddress);
            }

            $dc->update($updates);
        }

        return [DailyCustomer::class, $dc->id, $dc->working_group_id ?? $defaultGroup];
    }

    /** Parse .env list like: PRINTAIR_NOTIFY_EMAILS="a@x.com,b@y.com" */
    protected function notifyEmails(): array
    {
        $raw = config('printair.notify_emails');
        return collect(explode(',', (string)$raw))
            ->map(fn($e) => trim($e))
            ->filter()
            ->values()
            ->all();
    }

    protected function formatAddressForNotes(array $address): string
    {
        return collect([
            $address['line1'] ?? null,
            $address['line2'] ?? null,
            $address['city'] ?? null,
            $address['region'] ?? null,
            $address['postal_code'] ?? null,
            $address['country'] ?? null,
        ])->filter()->implode(', ');
    }
}
