<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_id',
        'amount_requested',
        'due_date',
        'status',
        'requested_by',
        'paid_at',
        'payment_method',
        'amount_paid',
        'notes',
        'admin_notes',
        'reference_number',
        'payment_details',
        'paid_by',
    ];

    protected $casts = [
        'amount_requested' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'payment_details' => 'array',
    ];

    /**
     * Get the order this payment request belongs to
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the user who created this payment request
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who marked this as paid
     */
    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    /**
     * Scope to get pending payment requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get paid payment requests
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope to get overdue payment requests
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now());
    }

    /**
     * Scope to get payment requests for a specific order
     */
    public function scopeForOrder($query, $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    /**
     * Check if payment request is overdue
     */
    public function isOverdue(): bool
    {
        return $this->status === 'pending' 
            && $this->due_date 
            && $this->due_date->isPast();
    }

    /**
     * Check if payment request is fully paid
     */
    public function isFullyPaid(): bool
    {
        return $this->status === 'paid' && $this->amount_paid >= $this->amount_requested;
    }

    /**
     * Check if payment request is partially paid
     */
    public function isPartiallyPaid(): bool
    {
        return $this->status === 'partially_paid' && $this->amount_paid > 0 && $this->amount_paid < $this->amount_requested;
    }

    /**
     * Get remaining amount to be paid
     */
    public function getRemainingAmountAttribute(): float
    {
        return max(0, $this->amount_requested - $this->amount_paid);
    }

    /**
     * Get payment progress percentage
     */
    public function getPaymentProgressAttribute(): float
    {
        if ($this->amount_requested <= 0) {
            return 0;
        }
        return min(100, ($this->amount_paid / $this->amount_requested) * 100);
    }

    /**
     * Mark payment request as paid
     */
    public function markAsPaid(float $amount, string $method, ?string $reference = null, ?int $paidBy = null): void
    {
        $this->amount_paid += $amount;
        $this->payment_method = $method;
        $this->reference_number = $reference;
        $this->paid_by = $paidBy;

        if ($this->amount_paid >= $this->amount_requested) {
            $this->status = 'paid';
            $this->paid_at = now();
        } else {
            $this->status = 'partially_paid';
        }

        $this->save();
    }

    /**
     * Cancel payment request
     */
    public function cancel(?string $reason = null): void
    {
        $this->status = 'cancelled';
        if ($reason) {
            $this->admin_notes = ($this->admin_notes ? $this->admin_notes . "\n\n" : '') . 
                "Cancelled: " . $reason;
        }
        $this->save();
    }

    /**
     * Update overdue status
     */
    public function updateOverdueStatus(): void
    {
        if ($this->isOverdue() && $this->status === 'pending') {
            $this->status = 'overdue';
            $this->save();
        }
    }
}
