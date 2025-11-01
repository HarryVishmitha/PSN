<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\WorkingGroup;
use App\Services\OrderItemCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(5, min($perPage, 100));

        $sortBy = $request->input('sort', 'created_at');
        $sortDir = $request->input('direction', 'desc');

        $allowedSorts = ['created_at', 'placed_at', 'total_amount', 'status'];
        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        $query = Order::query()
            ->with(['workingGroup:id,name'])
            ->withCount('items');

        if ($status = $request->input('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($wg = $request->integer('working_group_id')) {
            $query->where('working_group_id', $wg);
        }

        if ($from = $request->input('from')) {
            $query->whereDate('created_at', '>=', Carbon::parse($from)->startOfDay());
        }

        if ($to = $request->input('to')) {
            $query->whereDate('created_at', '<=', Carbon::parse($to)->endOfDay());
        }

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('contact_first_name', 'like', "%{$search}%")
                  ->orWhere('contact_last_name', 'like', "%{$search}%")
                  ->orWhere('contact_email', 'like', "%{$search}%")
                  ->orWhere('contact_phone', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");

                if (is_numeric($search)) {
                    $q->orWhere('id', (int) $search);
                }
            });
        }

        $orders = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Order $order) {
                return [
                    'id'              => $order->id,
                    'number'          => $order->number ?? sprintf('ORD-%05d', $order->id),
                    'status'          => $order->status,
                    'total_amount'    => $order->total_amount,
                    'subtotal_amount' => $order->subtotal_amount,
                    'discount_amount' => $order->discount_amount,
                    'tax_amount'      => $order->tax_amount,
                    'shipping_amount' => $order->shipping_amount,
                    'items_count'     => $order->items_count,
                    'working_group'   => $order->workingGroup?->only(['id', 'name']),
                    'contact'         => [
                        'name'  => trim(collect([$order->contact_first_name, $order->contact_last_name])->filter()->implode(' ')),
                        'email' => $order->contact_email,
                        'phone' => $order->contact_phone,
                    ],
                    'created_at'      => optional($order->created_at)->toIso8601String(),
                    'placed_at'       => optional($order->placed_at)->toIso8601String(),
                ];
            });

        $statusSummary = Order::selectRaw('status, COUNT(*) as total_orders, SUM(total_amount) as total_value')
            ->groupBy('status')
            ->get()
            ->map(fn($row) => [
                'status' => $row->status,
                'total'  => (int) $row->total_orders,
                'value'  => (float) $row->total_value,
            ]);

        return Inertia::render('admin/orders/index', [
            'orders'          => $orders,
            'filters'         => [
                'status'           => $request->input('status', 'all'),
                'working_group_id' => $request->input('working_group_id'),
                'from'             => $request->input('from'),
                'to'               => $request->input('to'),
                'search'           => $request->input('search', ''),
                'sort'             => $sortBy,
                'direction'        => $sortDir,
            ],
            'workingGroups'   => WorkingGroup::orderBy('name')->get(['id', 'name']),
            'statusSummary'   => $statusSummary,
            'statusOptions'   => $this->statusOptions(),
            'userDetails'     => Auth::user(),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load([
            'workingGroup:id,name',
            'shippingMethod:id,name,estimated_eta',
            'billingAddress',
            'shippingAddress',
            'items.product:id,name,pricing_method,price,price_per_sqft,unit_of_measure',
            'items.variant:id,product_id,variant_name,variant_value,price_adjustment',
            'items.subvariant:id,product_variant_id,subvariant_name,subvariant_value,price_adjustment',
            'items.roll:id,roll_type,roll_size,roll_width,roll_height,price_rate_per_sqft,offcut_price',
            'events.author:id,name',
            'estimate:id,estimate_number,status,total_amount',
        ]);

        $items = $order->items->values()->map(function ($item, $idx) {
            // Determine if this is a roll item from either the is_roll flag or product pricing method
            $isRollItem = (bool) $item->is_roll || $item->product?->pricing_method === 'roll';
            
            $rollInfo = null;
            if ($isRollItem) {
                // Get cut dimensions from either cut_width_in/cut_height_in fields OR width/height fields
                $cutWidthIn = $item->cut_width_in ?? $item->width ?? null;
                $cutHeightIn = $item->cut_height_in ?? $item->height ?? null;
                
                $widthFt = $cutWidthIn ? $cutWidthIn / 12.0 : null;
                $heightFt = $cutHeightIn ? $cutHeightIn / 12.0 : null;
                $offcutIn = null;
                $offcutArea = null;
                
                if ($item->roll) {
                    $rollWidthIn = ($item->roll->roll_width ?? 0) * 12.0;
                    if ($rollWidthIn > 0 && $cutWidthIn) {
                        $offcutIn = max($rollWidthIn - $cutWidthIn, 0.0);
                        if ($cutHeightIn) {
                            $offcutArea = ($offcutIn / 12.0) * ($cutHeightIn / 12.0);
                        }
                    }
                }
                
                $rollInfo = [
                    'roll'             => $item->roll?->only(['id', 'roll_type', 'roll_size', 'roll_width', 'roll_height', 'price_rate_per_sqft', 'offcut_price']),
                    'cut_width_in'     => $cutWidthIn,
                    'cut_height_in'    => $cutHeightIn,
                    'cut_width_ft'     => $widthFt ? round($widthFt, 3) : null,
                    'cut_height_ft'    => $heightFt ? round($heightFt, 3) : null,
                    'offcut_width_in'  => $offcutIn ? round($offcutIn, 3) : null,
                    'offcut_area_ft2'  => $offcutArea ? round($offcutArea, 3) : null,
                    'offcut_rate'      => $item->offcut_price_per_sqft ?? $item->roll?->offcut_price ?? null,
                ];
            }

            return [
                'id'                 => $item->id,
                'product'            => $item->product?->only(['id', 'name', 'pricing_method', 'price', 'price_per_sqft', 'unit_of_measure']),
                'variant'            => $item->variant?->only(['id', 'variant_name', 'variant_value', 'price_adjustment']),
                'subvariant'         => $item->subvariant?->only(['id', 'subvariant_name', 'subvariant_value', 'price_adjustment']),
                'name'               => $item->name ?? $item->product?->name,
                'description'        => $item->description,
                'unit'               => $item->unit ?? $item->size_unit ?? 'unit',
                'quantity'           => (float) $item->quantity,
                'unit_price'         => (float) $item->unit_price,
                'line_total'         => (float) $item->line_total,
                'is_roll'            => $isRollItem,
                'roll_details'       => $rollInfo,
                'roll_id'            => $item->roll_id,
                'offcut_price'       => $item->offcut_price_per_sqft,
                'options'            => $item->options,
            ];
        });

        $timeline = $order->events()
            ->latest('created_at')
            ->get()
            ->map(fn(OrderEvent $event) => [
                'id'         => $event->id,
                'event_type' => $event->event_type,
                'visibility' => $event->visibility,
                'title'      => $event->title,
                'message'    => $event->message,
                'old_status' => $event->old_status,
                'new_status' => $event->new_status,
                'data'       => $event->data,
                'created_at' => optional($event->created_at)->toIso8601String(),
                'author'     => $event->author?->only(['id', 'name']),
            ]);

        return Inertia::render('admin/orders/show', [
            'order' => [
                'id'                => $order->id,
                'number'            => $order->number ?? sprintf('ORD-%05d', $order->id),
                'status'            => $order->status,
                'working_group_id'  => $order->working_group_id,
                'working_group'     => $order->workingGroup?->only(['id', 'name']),
                'estimate'          => $order->estimate?->only(['id', 'estimate_number', 'status', 'total_amount']),
                'subtotal_amount'   => (float) $order->subtotal_amount,
                'discount_amount'   => (float) $order->discount_amount,
                'discount_mode'     => $order->discount_mode,
                'discount_value'    => (float) $order->discount_value,
                'tax_amount'        => (float) $order->tax_amount,
                'tax_mode'          => $order->tax_mode,
                'tax_value'         => (float) $order->tax_value,
                'shipping_amount'   => (float) $order->shipping_amount,
                'total_amount'      => (float) $order->total_amount,
                'notes'             => $order->notes,
                'contact_first_name'=> $order->contact_first_name,
                'contact_last_name' => $order->contact_last_name,
                'contact_email'     => $order->contact_email,
                'contact_phone'     => $order->contact_phone,
                'contact_whatsapp'  => $order->contact_whatsapp,
                'company_name'      => $order->company_name,
                'is_company'        => (bool) $order->is_company,
                'phone_alt_1'       => $order->phone_alt_1,
                'phone_alt_2'       => $order->phone_alt_2,
                'shipping_method'   => $order->shippingMethod?->only(['id', 'name', 'estimated_eta']),
                'shipping_address'  => $order->shippingAddress?->only(['id', 'line1', 'line2', 'city', 'region', 'postal_code', 'country']),
                'billing_address'   => $order->billingAddress?->only(['id', 'line1', 'line2', 'city', 'region', 'postal_code', 'country']),
                'created_at'        => optional($order->created_at)->toIso8601String(),
                'placed_at'         => optional($order->placed_at)->toIso8601String(),
                'items'             => $items,
            ],
            'timeline'        => $timeline,
            'statusOptions'   => $this->statusOptions(),
            'workingGroups'   => WorkingGroup::orderBy('name')->get(['id', 'name']),
            'shippingMethods' => ShippingMethod::orderBy('name')->get(['id', 'name', 'estimated_eta']),
            'userDetails'     => Auth::user(),
        ]);
    }

    public function update(Request $request, Order $order, OrderItemCalculator $calculator): JsonResponse
    {
        $data = $request->validate([
            'status'            => ['required', 'string', 'max:50'],
            'status_note'       => ['nullable', 'string'],
            'status_visibility' => ['nullable', Rule::in([
                OrderEvent::VISIBILITY_ADMIN,
                OrderEvent::VISIBILITY_CUSTOMER,
                OrderEvent::VISIBILITY_PUBLIC,
            ])],
            'working_group_id'  => ['nullable', 'integer', 'exists:working_groups,id'],
            'estimate_id'       => ['nullable', 'integer', 'exists:estimates,id'],
            'discount_mode'     => ['required', Rule::in(['none', 'fixed', 'percent'])],
            'discount_value'    => ['nullable', 'numeric', 'min:0'],
            'tax_mode'          => ['required', Rule::in(['none', 'fixed', 'percent'])],
            'tax_value'         => ['nullable', 'numeric', 'min:0'],
            'shipping_amount'   => ['nullable', 'numeric', 'min:0'],
            'notes'             => ['nullable', 'string'],
            'contact_first_name'=> ['nullable', 'string', 'max:120'],
            'contact_last_name' => ['nullable', 'string', 'max:120'],
            'contact_email'     => ['nullable', 'email', 'max:255'],
            'contact_phone'     => ['nullable', 'string', 'max:64'],
            'contact_whatsapp'  => ['nullable', 'string', 'max:64'],
            'company_name'      => ['nullable', 'string', 'max:255'],
            'is_company'        => ['sometimes', 'boolean'],
            'phone_alt_1'       => ['nullable', 'string', 'max:64'],
            'phone_alt_2'       => ['nullable', 'string', 'max:64'],
            'shipping_method_id'=> ['nullable', 'integer', 'exists:shipping_methods,id'],
            'items'             => ['required', 'array', 'min:1'],
            'items.*.product_id'           => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id'           => ['nullable', 'integer'],
            'items.*.subvariant_id'        => ['nullable', 'integer'],
            'items.*.description'          => ['nullable', 'string'],
            'items.*.quantity'             => ['required', 'numeric', 'min:0.001'],
            'items.*.unit'                 => ['nullable', 'string', 'max:32'],
            'items.*.unit_price'           => ['nullable', 'numeric', 'min:0'],
            'items.*.options'              => ['nullable', 'array'],
            'items.*.is_roll'              => ['sometimes', 'boolean'],
            'items.*.roll_id'              => ['nullable', 'integer', 'exists:rolls,id'],
            'items.*.cut_width_in'         => ['nullable', 'numeric', 'min:0'],
            'items.*.cut_height_in'        => ['nullable', 'numeric', 'min:0'],
            'items.*.offcut_price_per_sqft'=> ['nullable', 'numeric', 'min:0'],
        ]);

        $calculated = $calculator->compute($data['items']);

        $discount = match ($data['discount_mode']) {
            'fixed'   => max(0, (float) ($data['discount_value'] ?? 0)),
            'percent' => max(0, min(100, (float) ($data['discount_value'] ?? 0))) * $calculated['subtotal'] / 100,
            default   => 0,
        };

        $taxBase = max(0, $calculated['subtotal'] - $discount);
        $tax = match ($data['tax_mode']) {
            'fixed'   => max(0, (float) ($data['tax_value'] ?? 0)),
            'percent' => max(0, min(100, (float) ($data['tax_value'] ?? 0))) * $taxBase / 100,
            default   => 0,
        };

        $shipping = max(0, (float) ($data['shipping_amount'] ?? 0));
        $total = round(max(0, $calculated['subtotal'] - $discount + $tax + $shipping), 2);

        $oldStatus = $order->status;

        DB::transaction(function () use ($order, $data, $calculated, $discount, $tax, $shipping, $total) {
            $order->forceFill([
                'status'            => $data['status'],
                'working_group_id'  => $data['working_group_id'] ?? $order->working_group_id,
                'estimate_id'       => $data['estimate_id'] ?? $order->estimate_id,
                'subtotal_amount'   => $calculated['subtotal'],
                'discount_amount'   => round($discount, 2),
                'discount_mode'     => $data['discount_mode'],
                'discount_value'    => (float) ($data['discount_value'] ?? 0),
                'tax_amount'        => round($tax, 2),
                'tax_mode'          => $data['tax_mode'],
                'tax_value'         => (float) ($data['tax_value'] ?? 0),
                'shipping_amount'   => $shipping,
                'total_amount'      => $total,
                'notes'             => $data['notes'] ?? null,
                'contact_first_name'=> $data['contact_first_name'] ?? null,
                'contact_last_name' => $data['contact_last_name'] ?? null,
                'contact_email'     => $data['contact_email'] ?? null,
                'contact_phone'     => $data['contact_phone'] ?? null,
                'contact_whatsapp'  => $data['contact_whatsapp'] ?? null,
                'company_name'      => $data['company_name'] ?? null,
                'is_company'        => (bool) ($data['is_company'] ?? $order->is_company),
                'phone_alt_1'       => $data['phone_alt_1'] ?? null,
                'phone_alt_2'       => $data['phone_alt_2'] ?? null,
                'shipping_method_id'=> $data['shipping_method_id'] ?? $order->shipping_method_id,
                'updated_by'        => Auth::id(),
            ])->save();

            $order->items()->delete();

            foreach ($calculated['items'] as $idx => $calcItem) {
                $payload = $data['items'][$idx] ?? [];

                $order->items()->create([
                    'product_id'            => $calcItem['product_id'],
                    'variant_id'            => $calcItem['variant_id'],
                    'subvariant_id'         => $calcItem['subvariant_id'],
                    'name'                  => $calcItem['name'] ?? null,
                    'description'           => $calcItem['description'] ?? '',
                    'pricing_method'        => $calcItem['pricing_method'] ?? null,
                    'unit'                  => $calcItem['unit'] ?? ($payload['unit'] ?? null),
                    'size_unit'             => $payload['size_unit'] ?? ($calcItem['is_roll'] ? 'in' : $calcItem['unit'] ?? null),
                    'width'                 => $payload['width'] ?? ($calcItem['is_roll'] ? $calcItem['cut_width_in'] : null),
                    'height'                => $payload['height'] ?? ($calcItem['is_roll'] ? $calcItem['cut_height_in'] : null),
                    'quantity'              => $calcItem['quantity'],
                    'unit_price'            => $calcItem['unit_price'],
                    'line_total'            => $calcItem['line_total'],
                    'is_roll'               => $calcItem['is_roll'],
                    'roll_id'               => $calcItem['roll_id'],
                    'cut_width_in'          => $calcItem['cut_width_in'],
                    'cut_height_in'         => $calcItem['cut_height_in'],
                    'offcut_price_per_sqft' => $calcItem['offcut_price_per_sqft'],
                    'options'               => $payload['options'] ?? null,
                    'design_id'             => $payload['design_id'] ?? null,
                    'user_design_upload_id' => $payload['user_design_upload_id'] ?? null,
                    'hire_designer'         => (bool) ($payload['hire_designer'] ?? false),
                ]);
            }
        });

        if ($oldStatus !== $data['status']) {
            $order->recordStatusChange($data['status'], [
                'old_status' => $oldStatus,
                'message'    => $data['status_note'] ?? null,
                'visibility' => $data['status_visibility'] ?? OrderEvent::VISIBILITY_ADMIN,
                'created_by' => Auth::id(),
            ]);
        } else {
            $order->addEvent('order_updated', [
                'message'    => 'Order details updated by admin.',
                'created_by' => Auth::id(),
            ]);
        }

        return response()->json([
            'message' => 'Order updated successfully.',
        ]);
    }

    public function storeEvent(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'event_type' => ['required', 'string', 'max:64'],
            'title'      => ['nullable', 'string', 'max:255'],
            'message'    => ['nullable', 'string'],
            'visibility' => ['required', Rule::in([
                OrderEvent::VISIBILITY_ADMIN,
                OrderEvent::VISIBILITY_CUSTOMER,
                OrderEvent::VISIBILITY_PUBLIC,
            ])],
        ]);

        $event = $order->addEvent($data['event_type'], [
            'title'      => $data['title'] ?? null,
            'message'    => $data['message'] ?? null,
            'visibility' => $data['visibility'],
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Event added successfully.',
            'event'   => [
                'id'         => $event->id,
                'event_type' => $event->event_type,
                'visibility' => $event->visibility,
                'title'      => $event->title,
                'message'    => $event->message,
                'created_at' => optional($event->created_at)->toIso8601String(),
            ],
        ]);
    }

    public function previewPricing(Request $request, OrderItemCalculator $calculator): JsonResponse
    {
        $data = $request->validate([
            'discount_mode'     => ['required', Rule::in(['none', 'fixed', 'percent'])],
            'discount_value'    => ['nullable', 'numeric', 'min:0'],
            'tax_mode'          => ['required', Rule::in(['none', 'fixed', 'percent'])],
            'tax_value'         => ['nullable', 'numeric', 'min:0'],
            'shipping_amount'   => ['nullable', 'numeric', 'min:0'],
            'items'             => ['required', 'array', 'min:1'],
            'items.*.product_id'           => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'             => ['required', 'numeric', 'min:0.001'],
            'items.*.unit'                 => ['nullable', 'string', 'max:32'],
            'items.*.unit_price'           => ['nullable', 'numeric', 'min:0'],
            'items.*.is_roll'              => ['sometimes', 'boolean'],
            'items.*.roll_id'              => ['nullable', 'integer', 'exists:rolls,id'],
            'items.*.cut_width_in'         => ['nullable', 'numeric', 'min:0'],
            'items.*.cut_height_in'        => ['nullable', 'numeric', 'min:0'],
            'items.*.offcut_price_per_sqft'=> ['nullable', 'numeric', 'min:0'],
        ]);

        $calc = $calculator->compute($data['items']);

        $discount = match ($data['discount_mode']) {
            'fixed'   => max(0, (float) ($data['discount_value'] ?? 0)),
            'percent' => max(0, min(100, (float) ($data['discount_value'] ?? 0))) * $calc['subtotal'] / 100,
            default   => 0,
        };

        $taxBase = max(0, $calc['subtotal'] - $discount);
        $tax = match ($data['tax_mode']) {
            'fixed'   => max(0, (float) ($data['tax_value'] ?? 0)),
            'percent' => max(0, min(100, (float) ($data['tax_value'] ?? 0))) * $taxBase / 100,
            default   => 0,
        };

        $shipping = max(0, (float) ($data['shipping_amount'] ?? 0));
        $total = round(max(0, $calc['subtotal'] - $discount + $tax + $shipping), 2);

        return response()->json([
            'items'           => $calc['items'],
            'subtotal'        => $calc['subtotal'],
            'discount_amount' => round($discount, 2),
            'tax_amount'      => round($tax, 2),
            'shipping_amount' => $shipping,
            'total'           => $total,
        ]);
    }

    public function searchProducts(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search'           => ['nullable', 'string'],
            'pricing_method'   => ['nullable', Rule::in(['roll', 'standard'])],
            'working_group_id' => ['nullable', 'integer', 'exists:working_groups,id'],
            'limit'            => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $limit = $data['limit'] ?? 25;

        $query = Product::query()
            ->select(['id', 'name', 'working_group_id', 'pricing_method', 'price', 'price_per_sqft', 'unit_of_measure'])
            ->with(['workingGroup:id,name'])
            ->where('status', 'published');

        if (!empty($data['search'])) {
            $search = $data['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($data['pricing_method'])) {
            $query->where('pricing_method', $data['pricing_method']);
        }

        if (!empty($data['working_group_id'])) {
            $query->where('working_group_id', $data['working_group_id']);
        }

        $products = $query
            ->limit($limit)
            ->orderBy('name')
            ->get()
            ->map(fn(Product $product) => [
                'id'               => $product->id,
                'name'             => $product->name,
                'pricing_method'   => $product->pricing_method,
                'price'            => (float) $product->price,
                'price_per_sqft'   => (float) $product->price_per_sqft,
                'unit_of_measure'  => $product->unit_of_measure,
                'working_group'    => $product->workingGroup?->only(['id', 'name']),
            ]);

        return response()->json([
            'items' => $products,
        ]);
    }

    protected function statusOptions(): array
    {
        return [
            ['value' => 'pending',            'label' => 'Pending Review'],
            ['value' => 'estimating',         'label' => 'Estimating'],
            ['value' => 'quoted',             'label' => 'Estimate Sent'],
            ['value' => 'awaiting_approval',  'label' => 'Awaiting Approval'],
            ['value' => 'confirmed',          'label' => 'Confirmed'],
            ['value' => 'production',         'label' => 'In Production'],
            ['value' => 'ready_for_dispatch', 'label' => 'Ready for Dispatch'],
            ['value' => 'shipped',            'label' => 'Shipped'],
            ['value' => 'completed',          'label' => 'Completed'],
            ['value' => 'on_hold',            'label' => 'On Hold'],
            ['value' => 'cancelled',          'label' => 'Cancelled'],
        ];
    }
}
