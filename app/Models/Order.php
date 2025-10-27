<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'customer_type',
        'customer_id',
        'working_group_id',
        'estimate_id',
        'status',
        'placed_at',
        'billing_address_id',
        'shipping_address_id',
        'subtotal_amount',
        'discount_amount',
        'shipping_amount',
        'tax_amount',
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
    ];

    protected $casts = [
        'is_company'        => 'boolean',
        'subtotal_amount'   => 'decimal:2',
        'discount_amount'   => 'decimal:2',
        'shipping_amount'   => 'decimal:2',
        'tax_amount'        => 'decimal:2',
        'total_amount'      => 'decimal:2',
    ];

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
}
