<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentRequest;
use App\Models\Order;
use App\Models\OrderEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PaymentRequestController extends Controller
{
    /**
     * Get all payment requests for an order
     */
    public function index(Order $order)
    {
        $paymentRequests = $order->paymentRequests()
            ->with(['requestedBy:id,name', 'paidBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pr) {
                return [
                    'id' => $pr->id,
                    'amount_requested' => $pr->amount_requested,
                    'amount_paid' => $pr->amount_paid,
                    'remaining_amount' => $pr->remaining_amount,
                    'payment_progress' => $pr->payment_progress,
                    'due_date' => $pr->due_date?->format('Y-m-d'),
                    'status' => $pr->status,
                    'payment_method' => $pr->payment_method,
                    'reference_number' => $pr->reference_number,
                    'notes' => $pr->notes,
                    'admin_notes' => $pr->admin_notes,
                    'paid_at' => $pr->paid_at?->format('Y-m-d H:i:s'),
                    'requested_by' => $pr->requestedBy?->name,
                    'paid_by' => $pr->paidBy?->name,
                    'created_at' => $pr->created_at->format('Y-m-d H:i:s'),
                    'is_overdue' => $pr->isOverdue(),
                ];
            });

        return response()->json([
            'payment_requests' => $paymentRequests,
            'total_requested' => $paymentRequests->sum('amount_requested'),
            'total_paid' => $paymentRequests->sum('amount_paid'),
            'pending_count' => $paymentRequests->where('status', 'pending')->count(),
        ]);
    }

    /**
     * Create a new payment request
     */
    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'amount_requested' => 'required|numeric|min:0.01',
            'due_date' => 'nullable|date|after:today',
            'notes' => 'nullable|string|max:1000',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

    // Check if amount exceeds order total
    // Use the canonical field saved by OrderController::update()
    $orderTotal = (float) ($order->total_amount ?? 0);
        $totalRequested = $order->paymentRequests()->sum('amount_requested');
        $newTotal = $totalRequested + $validated['amount_requested'];

        if ($newTotal > $orderTotal) {
            return response()->json([
                'message' => 'Total payment requests cannot exceed order total',
                'order_total' => $orderTotal,
                'already_requested' => $totalRequested,
                'max_amount' => max(0, $orderTotal - $totalRequested),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $paymentRequest = $order->paymentRequests()->create([
                'amount_requested' => $validated['amount_requested'],
                'due_date' => $validated['due_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'admin_notes' => $validated['admin_notes'] ?? null,
                'requested_by' => Auth::id(),
                'status' => 'pending',
            ]);

            // Log event in order timeline
            OrderEvent::create([
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'event_type' => 'payment_request_created',
                'title' => 'Payment Request Created',
                'message' => "Payment request for " . number_format($validated['amount_requested'], 2) . " LKR created" .
                    ($validated['due_date'] ? " (Due: {$validated['due_date']})" : ''),
                'visibility' => 'admin',
                'data' => [
                    'payment_request_id' => $paymentRequest->id,
                    'amount' => $validated['amount_requested'],
                    'due_date' => $validated['due_date'] ?? null,
                ],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payment request created successfully',
                'payment_request' => $paymentRequest->load(['requestedBy:id,name']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create payment request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a payment request
     */
    public function update(Request $request, Order $order, PaymentRequest $paymentRequest)
    {
        // Ensure payment request belongs to this order
        if ($paymentRequest->order_id !== $order->id) {
            return response()->json(['message' => 'Payment request not found for this order'], 404);
        }

        $validated = $request->validate([
            'amount_requested' => 'sometimes|numeric|min:0.01',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $changes = [];
        foreach ($validated as $key => $value) {
            if ($paymentRequest->$key != $value) {
                $changes[$key] = [
                    'old' => $paymentRequest->$key,
                    'new' => $value,
                ];
            }
        }

        if (empty($changes)) {
            return response()->json(['message' => 'No changes detected'], 200);
        }

        DB::beginTransaction();
        try {
            $paymentRequest->update($validated);

            // Log event
            OrderEvent::create([
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'event_type' => 'payment_request_updated',
                'title' => 'Payment Request Updated',
                'message' => 'Payment request #' . $paymentRequest->id . ' was updated',
                'visibility' => 'admin',
                'data' => $changes,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payment request updated successfully',
                'payment_request' => $paymentRequest->fresh()->load(['requestedBy:id,name']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update payment request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark payment as received (full or partial)
     */
    public function markAsPaid(Request $request, Order $order, PaymentRequest $paymentRequest)
    {
        if ($paymentRequest->order_id !== $order->id) {
            return response()->json(['message' => 'Payment request not found for this order'], 404);
        }

        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|max:255',
            'reference_number' => 'nullable|string|max:255',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        // Validate amount doesn't exceed remaining
        $remaining = $paymentRequest->remaining_amount;
        if ($validated['amount_paid'] > $remaining) {
            return response()->json([
                'message' => 'Payment amount exceeds remaining balance',
                'remaining' => $remaining,
            ], 422);
        }

        DB::beginTransaction();
        try {
            $paymentRequest->markAsPaid(
                $validated['amount_paid'],
                $validated['payment_method'],
                $validated['reference_number'] ?? null,
                Auth::id()
            );

            if ($validated['admin_notes'] ?? null) {
                $paymentRequest->admin_notes = ($paymentRequest->admin_notes ? $paymentRequest->admin_notes . "\n\n" : '') . 
                    now()->format('Y-m-d H:i') . " - " . $validated['admin_notes'];
                $paymentRequest->save();
            }

            // Log event
            OrderEvent::create([
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'event_type' => 'payment_received',
                'title' => 'Payment Received',
                'message' => number_format($validated['amount_paid'], 2) . " LKR received via {$validated['payment_method']}" .
                    ($validated['reference_number'] ? " (Ref: {$validated['reference_number']})" : ''),
                'visibility' => 'admin',
                'data' => [
                    'payment_request_id' => $paymentRequest->id,
                    'amount_paid' => $validated['amount_paid'],
                    'payment_method' => $validated['payment_method'],
                    'reference_number' => $validated['reference_number'] ?? null,
                    'status' => $paymentRequest->status,
                ],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment_request' => $paymentRequest->fresh()->load(['requestedBy:id,name', 'paidBy:id,name']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel a payment request
     */
    public function cancel(Request $request, Order $order, PaymentRequest $paymentRequest)
    {
        if ($paymentRequest->order_id !== $order->id) {
            return response()->json(['message' => 'Payment request not found for this order'], 404);
        }

        if ($paymentRequest->status === 'paid') {
            return response()->json(['message' => 'Cannot cancel a paid payment request'], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $paymentRequest->cancel($validated['reason'] ?? null);

            // Log event
            OrderEvent::create([
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'event_type' => 'payment_request_cancelled',
                'title' => 'Payment Request Cancelled',
                'message' => 'Payment request #' . $paymentRequest->id . ' was cancelled' .
                    ($validated['reason'] ? ": {$validated['reason']}" : ''),
                'visibility' => 'admin',
                'data' => [
                    'payment_request_id' => $paymentRequest->id,
                    'reason' => $validated['reason'] ?? null,
                ],
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Payment request cancelled successfully',
                'payment_request' => $paymentRequest->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to cancel payment request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a payment request
     */
    public function destroy(Order $order, PaymentRequest $paymentRequest)
    {
        if ($paymentRequest->order_id !== $order->id) {
            return response()->json(['message' => 'Payment request not found for this order'], 404);
        }

        if ($paymentRequest->amount_paid > 0) {
            return response()->json(['message' => 'Cannot delete a payment request with recorded payments'], 422);
        }

        DB::beginTransaction();
        try {
            // Log event before deleting
            OrderEvent::create([
                'order_id' => $order->id,
                'user_id' => Auth::id(),
                'event_type' => 'payment_request_deleted',
                'title' => 'Payment Request Deleted',
                'message' => 'Payment request for ' . number_format($paymentRequest->amount_requested, 2) . ' LKR was deleted',
                'visibility' => 'admin',
                'data' => [
                    'amount' => $paymentRequest->amount_requested,
                ],
            ]);

            $paymentRequest->delete();

            DB::commit();

            return response()->json([
                'message' => 'Payment request deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete payment request',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
