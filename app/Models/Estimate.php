<?php

// app/Models/Estimate.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{MorphTo, BelongsTo, HasMany};

class Estimate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'estimate_number',
        'customer_type',
        'customer_id',
        'working_group_id',
        'status',
        'valid_from',
        'valid_to',
        'po_number',
        'billing_address_id',
        'subtotal_amount',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'created_by',
        'published_at',

        // NEW snapshot + money modes
        'client_name',
        'client_email',
        'client_phone',
        'client_address',
        'discount_mode',
        'discount_value',
        'tax_mode',
        'tax_value',
        'shipping_amount',

        // Internal notes (if you added the column)
        'internal_notes',
        // If you kept using `notes` for internal notes, keep this instead:
        'notes',
    ];

    protected $casts = [
        'valid_from'      => 'datetime',
        'valid_to'        => 'datetime',
        'published_at'    => 'datetime',
        'subtotal_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount'      => 'decimal:2',
        'total_amount'    => 'decimal:2',
        // NEW
        'discount_value'  => 'decimal:2',
        'tax_value'       => 'decimal:2',
        'shipping_amount' => 'decimal:2',
    ];

    /* Relationships */
    public function customer(): MorphTo
    {
        return $this->morphTo();
    }
    public function workingGroup(): BelongsTo
    {
        return $this->belongsTo(WorkingGroup::class);
    }
    public function billingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'billing_address_id');
    }
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function items(): HasMany
    {
        return $this->hasMany(EstimateItem::class);
    }
    public function logs(): HasMany
    {
        return $this->hasMany(EstimateLog::class);
    }

    /* Scopes */
    public function scopeActive($q)
    {
        return $q->where('valid_to', '>=', now());
    }
    public function scopeExpired($q)
    {
        return $q->where('valid_to', '<', now());
    }
    public function scopeStatus($q, ?string $s)
    {
        return $s ? $q->where('status', $s) : $q;
    }
    public function scopeValidBetween($q, ?string $from, ?string $to)
    {
        if (!$from && !$to) return $q;
        return $q->when($from, fn($qq) => $qq->where('valid_from', '>=', $from))
            ->when($to,   fn($qq) => $qq->where('valid_to',   '<=', $to));
    }
    public function scopeTotalBetween($q, $min, $max)
    {
        return $q->when($min !== null && $min !== '', fn($qq) => $qq->where('total_amount', '>=', $min))
            ->when($max !== null && $max !== '', fn($qq) => $qq->where('total_amount', '<=', $max));
    }

    /* Convenience accessors */
    protected $appends = ['is_expired'];
    public function getIsExpiredAttribute(): bool
    {
        return (bool) ($this->valid_to && $this->valid_to->isPast());
    }
}
