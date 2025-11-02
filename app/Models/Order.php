<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany,
    MorphTo,
    BelongsTo,
    BelongsToMany,
    HasMany,
    HasOne
};
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

class Order extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'customer_type',
        'customer_id',
        'working_group_id',
        'estimate_id',
        'number',
        'status',
        'placed_at',
        'billing_address_id',
        'shipping_address_id',
        'subtotal_amount',
        'discount_amount',
        'discount_mode',
        'discount_value',
        'shipping_amount',
        'tax_amount',
        'tax_mode',
        'tax_value',
        'total_amount',
        'design_status',
        'is_company',
        'company_name',
        'notes',
        'contact_first_name',
        'contact_last_name',
        'contact_email',
        'contact_phone',
        'contact_whatsapp',
        'phone_alt_1',
        'phone_alt_2',
        'shipping_method_id',
        'created_by',
        'updated_by',
        'locked_at',
        'locked_total',
        'locked_by',
        'cancellation_reason',
        'unlock_history',
    ];

    protected $hidden = [
        'tracking_token',
    ];

    protected $casts = [
        'is_company'        => 'boolean',
        'subtotal_amount'   => 'decimal:2',
        'discount_amount'   => 'decimal:2',
        'discount_value'    => 'decimal:2',
        'shipping_amount'   => 'decimal:2',
        'tax_amount'        => 'decimal:2',
        'tax_value'         => 'decimal:2',
        'total_amount'      => 'decimal:2',
        'locked_total'      => 'decimal:2',
        'placed_at'         => 'datetime',
        'locked_at'         => 'datetime',
        'unlock_history'    => 'array',
        'tracking_token_generated_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $order): void {
            if (blank($order->tracking_token)) {
                $order->tracking_token = static::generateUniqueTrackingToken();
                $order->tracking_token_generated_at = now();
            }
        });

        static::created(function (self $order): void {
            if (!Schema::hasColumn($order->getTable(), 'number')) {
                return;
            }

            if (!blank($order->getOriginal('number'))) {
                return;
            }

            $order->forceFill([
                'number' => static::formatOrderNumber($order->id),
            ])->saveQuietly();
        });
    }

    public function customer(): MorphTo
    {
        return $this->morphTo();
    }

    public function workingGroup(): BelongsTo
    {
        return $this->belongsTo(WorkingGroup::class);
    }

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }

    public function billingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'billing_address_id');
    }

    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'shipping_address_id');
    }

    public function shippingMethod(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function events(): HasMany
    {
        return $this->hasMany(OrderEvent::class);
    }

    public function addEvent(string $eventType, array $payload = []): OrderEvent
    {
        $defaults = [
            'visibility' => $payload['visibility'] ?? OrderEvent::VISIBILITY_ADMIN,
            'old_status' => $payload['old_status'] ?? null,
            'new_status' => $payload['new_status'] ?? null,
            'title'      => $payload['title'] ?? null,
            'message'    => $payload['message'] ?? null,
            'data'       => $payload['data'] ?? null,
            'created_by' => $payload['created_by'] ?? null,
        ];

        return $this->events()->create(array_merge($defaults, [
            'event_type' => $eventType,
        ]));
    }

    public function recordStatusChange(string $toStatus, array $payload = []): OrderEvent
    {
        $oldStatus = $payload['old_status'] ?? $this->getOriginal('status');

        return $this->addEvent('status_changed', array_merge([
            'visibility' => $payload['visibility'] ?? OrderEvent::VISIBILITY_CUSTOMER,
            'old_status' => $oldStatus,
            'new_status' => $toStatus,
            'message'    => $payload['message'] ?? null,
            'created_by' => $payload['created_by'] ?? null,
        ], $payload));
    }

    public function locker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(OrderAttachment::class);
    }

    public function paymentRequests(): HasMany
    {
        return $this->hasMany(PaymentRequest::class);
    }

    /**
     * Check if the order is currently locked
     */
    public function isLocked(): bool
    {
        return !is_null($this->locked_at);
    }

    /**
     * Check if pricing is locked for this order based on status
     */
    public function isLockedForPricing(): bool
    {
        $lockedStatuses = config('order-statuses.locking.pricing_locked_statuses', []);
        return in_array($this->status, $lockedStatuses);
    }

    /**
     * Check if items are locked (can't add/remove/edit quantities)
     */
    public function isLockedForItems(): bool
    {
        $lockedStatuses = config('order-statuses.locking.items_locked_statuses', []);
        return in_array($this->status, $lockedStatuses);
    }

    /**
     * Check if a status transition is allowed
     */
    public function canTransitionTo(string $toStatus): bool
    {
        $transitions = config('order-statuses.transitions', []);
        $allowedTransitions = $transitions[$this->status] ?? [];

        return in_array($toStatus, $allowedTransitions);
    }

    /**
     * Get all available status transitions for current status
     * Returns array of status configurations with 'value' key for frontend
     */
    public function getAvailableTransitions(): array
    {
        $transitions = config('order-statuses.transitions', []);
        $allowedStatuses = $transitions[$this->status] ?? [];

        $statuses = config('order-statuses.statuses', []);
        $available = [];

        foreach ($allowedStatuses as $statusKey) {
            if (isset($statuses[$statusKey])) {
                $available[] = array_merge(
                    ['value' => $statusKey],
                    $statuses[$statusKey]
                );
            }
        }

        return $available;
    }

    /**
     * Get status configuration
     */
    public function getStatusConfig(?string $status = null): ?array
    {
        $status = $status ?? $this->status;
        return config("order-statuses.statuses.{$status}");
    }

    /**
     * Lock the order at current total
     */
    public function lockOrder(?int $userId = null): bool
    {
        if ($this->isLocked()) {
            return false;
        }

        $this->update([
            'locked_at' => now(),
            'locked_total' => $this->total_amount,
            'locked_by' => $userId,
        ]);

        $this->addEvent('order_locked', [
            'message' => 'Order locked at LKR ' . number_format($this->total_amount, 2),
            'data' => [
                'locked_total' => $this->total_amount,
                'locked_at' => $this->locked_at->toIso8601String(),
            ],
            'created_by' => $userId,
            'visibility' => OrderEvent::VISIBILITY_ADMIN,
        ]);

        return true;
    }

    /**
     * Unlock the order with reason
     */
    public function unlockOrder(string $reason, ?int $userId = null): bool
    {
        if (!$this->isLocked()) {
            return false;
            Log::info('Order is not locked, cannot unlock.', ['order_id' => $this->id]);
        }

        // Add to unlock history
        $history = $this->unlock_history ?? [];
        $history[] = [
            'unlocked_at' => now()->toIso8601String(),
            'unlocked_by' => $userId,
            'reason' => $reason,
            'previous_locked_at' => $this->locked_at?->toIso8601String(),
            'previous_locked_total' => (float) $this->locked_total,
        ];

        $this->update([
            'locked_at' => null,
            'locked_total' => null,
            'locked_by' => null,
            'unlock_history' => $history,
        ]);

        $this->addEvent('order_unlocked', [
            'message' => 'Order unlocked. Reason: ' . $reason,
            'data' => [
                'reason' => $reason,
                'previous_locked_total' => $this->locked_total,
            ],
            'created_by' => $userId,
            'visibility' => OrderEvent::VISIBILITY_ADMIN,
        ]);

        return true;
    }

    /**
     * Ensure the order has a tracking token and optionally force regeneration.
     */
    public function ensureTrackingToken(bool $forceRefresh = false): string
    {
        if ($forceRefresh || blank($this->tracking_token)) {
            $this->refreshTrackingToken();

            if ($this->exists) {
                $this->saveQuietly();
            }
        }

        return $this->tracking_token;
    }

    /**
     * Regenerate the tracking token without persisting to the database.
     */
    public function refreshTrackingToken(): string
    {
        $this->tracking_token = static::generateUniqueTrackingToken();
        $this->tracking_token_generated_at = now();

        return $this->tracking_token;
    }

    /**
     * Generate a unique token for guest order tracking.
     *
     * @throws RuntimeException
     */
    protected static function generateUniqueTrackingToken(): string
    {
        $attempts = 0;
        $maxAttempts = 5;
        $token = null;
        $exists = false;

        do {
            $token = static::makeTrackingToken();
            $exists = static::where('tracking_token', $token)->exists();
            $attempts++;
        } while ($exists && $attempts < $maxAttempts);

        if ($exists) {
            throw new RuntimeException('Unable to generate unique order tracking token.');
        }

        return $token;
    }

    /**
     * Create a random tracking token string.
     */
    protected static function makeTrackingToken(): string
    {
        try {
            return bin2hex(random_bytes(32));
        } catch (Exception $exception) {
            return hash('sha256', Str::uuid()->toString() . microtime(true));
        }
    }

    /**
     * Format order number based on identifier.
     */
    protected static function formatOrderNumber(int $orderId): string
    {
        return sprintf('ORD-%05d', $orderId);
    }

    /**
     * Get a formatted order number
     */
    public function getFormattedNumberAttribute(): string
    {
        return $this->number ?? static::formatOrderNumber($this->id);
    }

    /**
     * Check if order requires certain field for status
     */
    public function statusRequiresField(string $field): bool
    {
        $statusConfig = $this->getStatusConfig();
        return ($statusConfig['requires_field'] ?? null) === $field;
    }

    /**
     * Check if status requires a note
     */
    public function statusRequiresNote(?string $status = null): bool
    {
        $config = $this->getStatusConfig($status);
        return $config['requires_note'] ?? false;
    }

    /**
     * Check if status should auto-lock the order
     */
    public function statusShouldAutoLock(?string $status = null): bool
    {
        $config = $this->getStatusConfig($status);
        return $config['auto_lock_order'] ?? false;
    }

    /**
     * Check if status requires confirmation before transition
     */
    public function statusRequiresConfirmation(?string $status = null): bool
    {
        $config = $this->getStatusConfig($status);
        return $config['requires_confirmation'] ?? false;
    }

    /**
     * Check if status should send email
     */
    public function statusShouldSendEmail(?string $status = null): bool
    {
        $config = $this->getStatusConfig($status);
        return $config['send_email'] ?? false;
    }

    /**
     * Get number attribute (fallback to formatted number)
     */
    public function getNumberAttribute($value): string
    {
        return $value ?? static::formatOrderNumber($this->id);
    }
}
