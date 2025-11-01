<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderAttachment;
use App\Models\OrderEvent;
use App\Models\WorkingGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth']);
    }

    public function index(Request $request): Response
    {
        $user = Auth::user();

        $orders = Order::query()
            ->where('user_id', $user->id)
            ->latest()
            ->paginate((int) $request->integer('per_page', 10))
            ->withQueryString()
            ->through(function (Order $order) {
                $statusConfig = $order->getStatusConfig();

                return [
                    'id'            => $order->id,
                    'number'        => $order->number,
                    'status'        => $order->status,
                    'status_label'  => $statusConfig['label'] ?? ucfirst(str_replace('_', ' ', $order->status)),
                    'status_color'  => $statusConfig['color'] ?? 'gray',
                    'total_amount'  => (float) $order->total_amount,
                    'placed_at'     => optional($order->placed_at)->toIso8601String(),
                    'created_at'    => optional($order->created_at)->toIso8601String(),
                    'can_approve'   => in_array($order->status, ['estimate_sent', 'awaiting_customer_approval'], true),
                ];
            });

        return Inertia::render('user/orders/index', [
            'orders'      => $orders,
            'userDetails' => $user,
            'WG'          => $this->resolveWorkingGroup($user),
        ]);
    }

    public function show(Order $order): Response
    {
        $this->authorizeOrder($order);

        $order->load([
            'items.product:id,name,unit_of_measure,pricing_method',
            'items.variant:id,variant_name,variant_value',
            'items.subvariant:id,subvariant_name,subvariant_value',
            'attachments' => function ($query) {
                $query->where('file_type', 'estimate_pdf');
            },
            'estimate:id,estimate_number,status,total_amount',
        ]);

        $statusConfig = $order->getStatusConfig();

        $timeline = $order->events()
            ->whereIn('visibility', [OrderEvent::VISIBILITY_CUSTOMER, OrderEvent::VISIBILITY_PUBLIC])
            ->latest('created_at')
            ->get()
            ->map(fn (OrderEvent $event) => [
                'id'         => $event->id,
                'event_type' => $event->event_type,
                'title'      => $event->title,
                'message'    => $event->message,
                'old_status' => $event->old_status,
                'new_status' => $event->new_status,
                'created_at' => optional($event->created_at)->toIso8601String(),
            ]);

        $attachments = $order->attachments->map(function (OrderAttachment $attachment) {
            return [
                'id'        => $attachment->id,
                'file_name' => $attachment->file_name,
                'url'       => route('user.orders.attachments.download', [$attachment->order_id, $attachment->id]),
                'uploaded_at' => optional($attachment->created_at)->toIso8601String(),
            ];
        });

        return Inertia::render('user/orders/show', [
            'order' => [
                'id'              => $order->id,
                'number'          => $order->number,
                'status'          => $order->status,
                'status_label'    => $statusConfig['label'] ?? ucfirst(str_replace('_', ' ', $order->status)),
                'status_color'    => $statusConfig['color'] ?? 'gray',
                'status_description' => $statusConfig['description'] ?? null,
                'subtotal_amount' => (float) $order->subtotal_amount,
                'discount_amount' => (float) $order->discount_amount,
                'discount_mode'   => $order->discount_mode,
                'discount_value'  => (float) $order->discount_value,
                'tax_amount'      => (float) $order->tax_amount,
                'tax_mode'        => $order->tax_mode,
                'tax_value'       => (float) $order->tax_value,
                'shipping_amount' => (float) $order->shipping_amount,
                'total_amount'    => (float) $order->total_amount,
                'notes'           => $order->notes,
                'created_at'      => optional($order->created_at)->toIso8601String(),
                'placed_at'       => optional($order->placed_at)->toIso8601String(),
                'attachments'     => $attachments,
                'items'           => $order->items->map(function ($item) {
                    return [
                        'id'          => $item->id,
                        'name'        => $item->name ?? $item->product?->name,
                        'description' => $item->description,
                        'quantity'    => (float) $item->quantity,
                        'unit'        => $item->unit ?? $item->product?->unit_of_measure,
                        'unit_price'  => (float) $item->unit_price,
                        'line_total'  => (float) $item->line_total,
                    ];
                }),
                'can_approve'     => in_array($order->status, ['estimate_sent', 'awaiting_customer_approval'], true),
            ],
            'timeline'    => $timeline,
            'userDetails' => Auth::user(),
            'WG'          => $this->resolveWorkingGroup(Auth::user()),
        ]);
    }

    public function approve(Request $request, Order $order): JsonResponse
    {
        $this->authorizeOrder($order);

        if (!in_array($order->status, ['estimate_sent', 'awaiting_customer_approval'], true)) {
            return response()->json([
                'message' => 'This order cannot be approved in its current status.',
            ], 422);
        }

        if (!$order->canTransitionTo('customer_approved')) {
            return response()->json([
                'message' => 'Order cannot transition to Customer Approved from current status.',
            ], 422);
        }

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $note = trim($data['note'] ?? '') ?: 'Customer confirmed the estimate via customer portal.';

        DB::transaction(function () use ($order, $note) {
            $oldStatus = $order->status;

            $order->forceFill([
                'status'     => 'customer_approved',
                'updated_by' => Auth::id(),
            ])->save();

            $order->recordStatusChange('customer_approved', [
                'old_status' => $oldStatus,
                'message'    => $note,
                'visibility' => OrderEvent::VISIBILITY_CUSTOMER,
                'created_by' => Auth::id(),
            ]);
        });

        return response()->json([
            'message' => 'Thank you! We have recorded your approval.',
        ]);
    }

    public function downloadAttachment(Order $order, OrderAttachment $attachment)
    {
        $this->authorizeOrder($order);

        if ($attachment->order_id !== $order->id || $attachment->file_type !== 'estimate_pdf') {
            abort(404);
        }

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);
    }

    protected function authorizeOrder(Order $order): void
    {
        if ($order->user_id !== Auth::id()) {
            abort(403);
        }
    }

    protected function resolveWorkingGroup($user): array
    {
        if (!$user->working_group_id) {
            return [
                'name' => 'Public',
                'wg_image' => null,
            ];
        }

        $wg = WorkingGroup::find($user->working_group_id);

        if (!$wg) {
            return [
                'name' => 'Public',
                'wg_image' => null,
            ];
        }

        return $wg->only(['id', 'name', 'wg_image']);
    }
}
