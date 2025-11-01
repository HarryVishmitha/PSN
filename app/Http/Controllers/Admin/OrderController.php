<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\WorkingGroup;
use App\Services\EstimatePdfService;
use App\Services\OrderItemCalculator;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

        // Get available status transitions
        $availableTransitions = $order->getAvailableTransitions();
        $statusConfig = $order->getStatusConfig();

        return Inertia::render('admin/orders/show', [
            'order' => [
                'id'                => $order->id,
                'number'            => $order->number ?? sprintf('ORD-%05d', $order->id),
                'status'            => $order->status,
                'status_config'     => $statusConfig,
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
                'is_locked'         => $order->isLocked(),
                'locked_at'         => optional($order->locked_at)->toIso8601String(),
                'locked_total'      => $order->locked_total,
                'locked_by'         => $order->locker?->only(['id', 'name']),
                'is_pricing_locked' => $order->isLockedForPricing(),
                'is_items_locked'   => $order->isLockedForItems(),
                'cancellation_reason' => $order->cancellation_reason,
            ],
            'timeline'           => $timeline,
            'statusOptions'      => $this->statusOptions(),
            'availableStatuses'  => $availableTransitions,
            'workingGroups'      => WorkingGroup::orderBy('name')->get(['id', 'name']),
            'shippingMethods'    => ShippingMethod::orderBy('name')->get(['id', 'name', 'estimated_eta']),
            'userDetails'        => Auth::user(),
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
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
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

        $oldStatus = $order->status;
        $newStatus = $data['status'];

        // VALIDATION 1: Check status transition is allowed
        if ($oldStatus !== $newStatus && !$order->canTransitionTo($newStatus)) {
            Log::info("Invalid status transition attempted", [
                'order_id'   => $order->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'user_id'    => Auth::id(),
            ]);
            return response()->json([
                'message' => "Cannot transition from '{$oldStatus}' to '{$newStatus}'. This transition is not allowed.",
                'error' => 'invalid_transition',
            ], 422);
        }

        // VALIDATION 2: Check if status requires a note
        if ($oldStatus !== $newStatus && $order->statusRequiresNote($newStatus)) {
            Log::error('new status requires a note');
            if (empty(trim($data['status_note'] ?? ''))) {
                $statusLabel = config("order-statuses.statuses.{$newStatus}.label", $newStatus);
                return response()->json([
                    'message' => "Status '{$statusLabel}' requires a note explaining the reason.",
                    'error' => 'note_required',
                ], 422);
            }
        }

        // VALIDATION 3: Check if status requires cancellation reason
        if ($newStatus === 'cancelled' && empty(trim($data['cancellation_reason'] ?? ''))) {
            Log::error('Cancellation reason is required');
            return response()->json([
                'message' => 'Cancellation reason is required.',
                'error' => 'cancellation_reason_required',
            ], 422);
        }

        // VALIDATION 4: Check if order is locked for item changes
        if ($order->isLockedForItems()) {
            // Compare old items vs new items to detect changes
            $oldItemIds = $order->items->pluck('id')->sort()->values()->toArray();
            $itemsChanged = count($oldItemIds) !== count($data['items']);
            
            if (!$itemsChanged) {
                // Check if quantities or products changed
                foreach ($order->items as $idx => $oldItem) {
                    $newItem = $data['items'][$idx] ?? null;
                    if (!$newItem || 
                        $oldItem->product_id != $newItem['product_id'] ||
                        abs($oldItem->quantity - $newItem['quantity']) > 0.001) {
                        $itemsChanged = true;
                        break;
                    }
                }
            }
            
            if ($itemsChanged) {
                return response()->json([
                    'message' => 'Order items are locked. Cannot add, remove, or modify items for orders in this status.',
                    'error' => 'items_locked',
                    'locked_at' => $order->locked_at?->toIso8601String(),
                ], 423);
            }
        }

        // VALIDATION 5: Check if order is locked for pricing changes
        if ($order->isLockedForPricing()) {
            $pricingChanged = false;

            // Treat omitted pricing-related fields as "no change" by defaulting to existing values.
            $incomingDiscountValue = $data['discount_value'] ?? $order->discount_value;
            $incomingTaxValue = $data['tax_value'] ?? $order->tax_value;
            $incomingDiscountMode = $data['discount_mode'] ?? $order->discount_mode;
            $incomingTaxMode = $data['tax_mode'] ?? $order->tax_mode;
            $incomingShipping = $data['shipping_amount'] ?? $order->shipping_amount;

            // Check if discount, tax, or shipping changed
            if (abs($order->discount_value - $incomingDiscountValue) > 0.01 ||
                abs($order->tax_value - $incomingTaxValue) > 0.01 ||
                abs($order->shipping_amount - $incomingShipping) > 0.01 ||
                $order->discount_mode !== $incomingDiscountMode ||
                $order->tax_mode !== $incomingTaxMode) {
                $pricingChanged = true;
            }

            // Check item prices, but only when the incoming payload explicitly provides a unit_price
            if (!$pricingChanged) {
                foreach ($order->items as $idx => $oldItem) {
                    $newItem = $data['items'][$idx] ?? null;
                    if (!$newItem) {
                        // No corresponding incoming item for an existing item -> treat as change
                        $pricingChanged = true;
                        break;
                    }

                    if (array_key_exists('unit_price', $newItem)) {
                        $incomingUnitPrice = $newItem['unit_price'];

                        // Treat null/empty values as "no intent to change pricing"
                        if ($incomingUnitPrice === null || $incomingUnitPrice === '') {
                            continue;
                        }

                        // Compare only when unit_price is explicitly provided
                        if (abs($oldItem->unit_price - (float) $incomingUnitPrice) > 0.01) {
                            $pricingChanged = true;
                            break;
                        }
                    }
                }
            }

            if ($pricingChanged) {
                return response()->json([
                    'message' => 'Pricing is locked for this order status. Cannot modify prices, discounts, shipping, or taxes.',
                    'error' => 'pricing_locked',
                    'status' => $order->status,
                ], 423);
            }
        }

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

        // Track field changes for detailed logging
        $changes = [];
        if ($order->discount_value != ($data['discount_value'] ?? 0)) {
            $changes[] = ['field' => 'discount_value', 'old' => $order->discount_value, 'new' => $data['discount_value'] ?? 0];
        }
        if ($order->tax_value != ($data['tax_value'] ?? 0)) {
            $changes[] = ['field' => 'tax_value', 'old' => $order->tax_value, 'new' => $data['tax_value'] ?? 0];
        }
        if ($order->shipping_amount != $shipping) {
            $changes[] = ['field' => 'shipping_amount', 'old' => $order->shipping_amount, 'new' => $shipping];
        }

        DB::transaction(function () use ($order, $data, $calculated, $discount, $tax, $shipping, $total, $oldStatus, $newStatus, $changes) {
            $updateData = [
                'status'            => $newStatus,
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
            ];

            // Add cancellation reason if transitioning to cancelled
            if ($newStatus === 'cancelled' && !empty($data['cancellation_reason'])) {
                $updateData['cancellation_reason'] = $data['cancellation_reason'];
            }

            $order->forceFill($updateData)->save();

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

        // Reload order to get fresh data
        $order->refresh();

        // Auto-lock order if new status requires it
        if ($oldStatus !== $newStatus && $order->statusShouldAutoLock($newStatus) && !$order->isLocked()) {
            $order->lockOrder(Auth::id());
        }

        // Record status change with detailed information
        if ($oldStatus !== $newStatus) {
            $eventData = [
                'old_status' => $oldStatus,
                'message'    => $data['status_note'] ?? null,
                'visibility' => $data['status_visibility'] ?? OrderEvent::VISIBILITY_CUSTOMER,
                'created_by' => Auth::id(),
            ];

            // Add cancellation reason to event data
            if ($newStatus === 'cancelled' && !empty($data['cancellation_reason'])) {
                $eventData['data'] = ['cancellation_reason' => $data['cancellation_reason']];
            }

            $statusEvent = $order->recordStatusChange($newStatus, $eventData);

            // Create/refresh estimate when transitioning to estimate_sent
            if ($newStatus === 'estimate_sent') {
                try {
                    $estimate = null;

                    if (!$order->estimate_id) {
                        $estimate = $this->createEstimateFromOrder($order);
                        $order->update(['estimate_id' => $estimate->id]);
                        $order->setRelation('estimate', $estimate);

                        \Illuminate\Support\Facades\Log::info('Estimate created from order', [
                            'order_id' => $order->id,
                            'estimate_id' => $estimate->id,
                        ]);
                    } else {
                        $estimate = $order->estimate()->with('items')->first();
                        if ($estimate) {
                            $order->setRelation('estimate', $estimate);
                        }
                    }

                    if ($estimate) {
                        $this->attachEstimatePdfToOrder($order, $estimate, $statusEvent);
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to create estimate or attach PDF for order', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Send email notification if status changed and customer email exists
            if ($order->contact_email) {
                try {
                    \Illuminate\Support\Facades\Mail::to($order->contact_email)
                        ->send(new \App\Mail\OrderStatusChanged($order, $oldStatus, $newStatus));
                    
                    \Illuminate\Support\Facades\Log::info('Order status change email sent', [
                        'order_id' => $order->id,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'email' => $order->contact_email,
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to send order status change email', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } else {
            // Log field-level changes if no status change
            if (!empty($changes)) {
                $order->addEvent('order_updated', [
                    'message'    => 'Order details updated by admin.',
                    'data'       => ['changes' => $changes],
                    'created_by' => Auth::id(),
                    'visibility' => OrderEvent::VISIBILITY_ADMIN,
                ]);
            } else {
                $order->addEvent('order_updated', [
                    'message'    => 'Order details updated by admin.',
                    'created_by' => Auth::id(),
                    'visibility' => OrderEvent::VISIBILITY_ADMIN,
                ]);
            }
        }

        return response()->json([
            'message' => 'Order updated successfully.',
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
                'is_locked' => $order->isLocked(),
                'locked_at' => $order->locked_at?->toIso8601String(),
                'locked_total' => $order->locked_total,
                'total_amount' => $order->total_amount,
            ],
        ]);
    }

    public function unlock(Request $request, Order $order): JsonResponse
    {
        if (!$order->isLocked()) {
            return response()->json([
                'message' => 'Order is not locked.',
            ], 422);
        }

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        try {
            $order->unlockOrder($data['reason'], Auth::id());
            return response()->json([
                'message' => 'Order unlocked successfully.',
                'order' => [
                    'id' => $order->id,
                    'is_locked' => false,
                    'locked_at' => null,
                ],
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Failed to unlock order: ' . $th->getMessage(),
            ], 500);
        }
    }

    public function getAvailableStatuses(Order $order): JsonResponse
    {
        $available = $order->getAvailableTransitions();
        
        return response()->json([
            'current_status' => $order->status,
            'available_statuses' => $available,
            'is_locked' => $order->isLocked(),
            'is_pricing_locked' => $order->isLockedForPricing(),
            'is_items_locked' => $order->isLockedForItems(),
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
        // Keep this list in sync with config/order-statuses.php
        $options = [
            // Current initial/legacy pending state (shown as Pending Review in UI)
            ['value' => 'pending',            'label' => 'Pending Review'],

            // Draft/estimating phase
            ['value' => 'draft',              'label' => 'Estimating'],

            // Quotation and customer decision
            ['value' => 'estimate_sent',      'label' => 'Estimate Sent'],
            ['value' => 'awaiting_customer_approval', 'label' => 'Awaiting Customer Approval'],
            ['value' => 'customer_approved',  'label' => 'Customer Approved'],

            // Payment flow
            ['value' => 'payment_requested',  'label' => 'Payment Requested'],
            ['value' => 'partially_paid',     'label' => 'Partially Paid'],
            ['value' => 'paid',               'label' => 'Payment Confirmed'],

            // Production and fulfillment
            ['value' => 'in_production',      'label' => 'In Production'],
            ['value' => 'ready_for_delivery', 'label' => 'Ready for Dispatch'],
            ['value' => 'completed',          'label' => 'Completed'],

            // Pause/cancel
            ['value' => 'on_hold',            'label' => 'On Hold'],
            ['value' => 'cancelled',          'label' => 'Cancelled'],

            // Optional legacy/back-compat statuses (may not appear as available transitions)
            ['value' => 'pending_review',     'label' => 'Pending Review (Deprecated)'],
            ['value' => 'confirmed',          'label' => 'Confirmed (Legacy)'],
            ['value' => 'returned',           'label' => 'Returned (Legacy)'],
        ];

        return array_map(function (array $option) {
            $config = config("order-statuses.statuses.{$option['value']}", []);

            return array_merge($option, [
                'requires_note' => $config['requires_note'] ?? false,
                'locks_pricing' => $config['locks_pricing'] ?? false,
                'locks_items'   => $config['locks_items'] ?? false,
            ]);
        }, $options);
    }

    /**
     * Create an estimate from an order
     */
    protected function attachEstimatePdfToOrder(Order $order, \App\Models\Estimate $estimate, ?OrderEvent $statusEvent = null): void
    {
        try {
            $pdf = app(EstimatePdfService::class)->generate($estimate->id, true);

            $path = null;
            $filename = $estimate->estimate_number . '.pdf';
            $disk = 'public';
            $size = null;
            $mime = 'application/pdf';

            if (is_array($pdf)) {
                $path = $pdf['path'] ?? null;
                $filename = $pdf['filename'] ?? $filename;
                $disk = $pdf['disk'] ?? 'public';
                $size = $pdf['size'] ?? null;
                $mime = $pdf['mime_type'] ?? 'application/pdf';
            } elseif (is_string($pdf)) {
                $publicPrefix = '/storage/';
                if (str_starts_with($pdf, $publicPrefix)) {
                    $path = ltrim(substr($pdf, strlen($publicPrefix)), '/');
                } else {
                    $path = ltrim($pdf, '/');
                }
            }

            $path ??= 'estimates/' . $filename;

            $diskInstance = Storage::disk($disk);

            if ($diskInstance->exists($path)) {
                $size ??= $diskInstance->size($path);
                $mime ??= $diskInstance->mimeType($path) ?: 'application/pdf';
            }

            // Remove previous estimate PDFs to avoid duplicates
            $order->attachments()
                ->where('file_type', 'estimate_pdf')
                ->delete();

            $order->attachments()->create([
                'order_event_id' => $statusEvent?->id,
                'file_path'      => $path,
                'file_name'      => $filename,
                'file_type'      => 'estimate_pdf',
                'file_size'      => $size,
                'mime_type'      => $mime,
                'description'    => 'Estimate PDF generated when status changed to Estimate Sent.',
                'uploaded_by'    => Auth::id(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to attach estimate PDF to order', [
                'order_id'    => $order->id,
                'estimate_id' => $estimate->id,
                'error'       => $e->getMessage(),
            ]);
        }
    }

    /**
     * Create an estimate from an order
     */
    protected function createEstimateFromOrder(Order $order): \App\Models\Estimate
    {
        // Generate estimate number
        $latestEstimate = \App\Models\Estimate::latest('id')->first();
        $nextNumber = $latestEstimate ? ($latestEstimate->id + 1) : 1;
        $estimateNumber = 'EST-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

        // Create estimate
        $estimate = \App\Models\Estimate::create([
            'estimate_number' => $estimateNumber,
            'customer_type' => 'App\\Models\\User', // Adjust based on your customer type
            'customer_id' => $order->user_id,
            'working_group_id' => $order->working_group_id,
            'status' => 'draft',
            'valid_from' => now(),
            'valid_to' => now()->addDays(30),
            'client_name' => trim(($order->contact_first_name ?? '') . ' ' . ($order->contact_last_name ?? '')),
            'client_email' => $order->contact_email,
            'client_phone' => $order->contact_phone,
            'subtotal_amount' => $order->subtotal_amount,
            'discount_amount' => $order->discount_amount,
            'discount_mode' => $order->discount_mode,
            'discount_value' => $order->discount_value,
            'tax_amount' => $order->tax_amount,
            'tax_mode' => $order->tax_mode,
            'tax_value' => $order->tax_value,
            'shipping_amount' => $order->shipping_amount,
            'total_amount' => $order->total_amount,
            'notes' => $order->notes,
            'created_by' => Auth::id(),
        ]);

        // Copy order items to estimate items
        foreach ($order->items as $orderItem) {
            \App\Models\EstimateItem::create([
                'estimate_id' => $estimate->id,
                'product_id' => $orderItem->product_id,
                'variant_id' => $orderItem->variant_id,
                'subvariant_id' => $orderItem->subvariant_id,
                'description' => $orderItem->description,
                'quantity' => $orderItem->quantity,
                'unit' => $orderItem->unit,
                'unit_price' => $orderItem->unit_price,
                'line_total' => $orderItem->line_total,
                'is_roll' => $orderItem->is_roll,
                'roll_id' => $orderItem->roll_id,
                'cut_width_in' => $orderItem->cut_width_in,
                'cut_height_in' => $orderItem->cut_height_in,
                'offcut_price_per_sqft' => $orderItem->offcut_price_per_sqft,
                'options' => $orderItem->options,
            ]);
        }

        return $estimate;
    }
}
