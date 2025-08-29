<?php

namespace App\Models;

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
use Illuminate\Database\Eloquent\Builder;

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
    ];

    protected $casts = [
        'valid_from'      => 'datetime',
        'valid_to'        => 'datetime',
        'published_at'    => 'datetime',
        'subtotal_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount'      => 'decimal:2',
        'total_amount'    => 'decimal:2',
    ];

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

    public function items(): HasMany
    {
        return $this->hasMany(EstimateItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /* ---------- Scopes ---------- */

    /** Only estimates valid today or future (not expired) */
    public function scopeActive(Builder $q): Builder
    {
        return $q->where('valid_to', '>=', now());
    }

    /** Only expired estimates (past valid_to) */
    public function scopeExpired(Builder $q): Builder
    {
        return $q->where('valid_to', '<', now());
    }

    /** Generic status filter: draft/published/expired */
    public function scopeStatus(Builder $q, ?string $status): Builder
    {
        return $status ? $q->where('status', $status) : $q;
    }

    /** Date window filter on valid_from/valid_to overlap */
    public function scopeValidBetween(Builder $q, ?string $from, ?string $to): Builder
    {
        if (!$from && !$to) return $q;
        return $q->when($from, fn($qq) => $qq->where('valid_from', '>=', $from))
            ->when($to,   fn($qq) => $qq->where('valid_to',   '<=', $to));
    }

    /** Money range filter on total_amount */
    public function scopeTotalBetween(Builder $q, ?string $min, ?string $max): Builder
    {
        return $q->when($min !== null && $min !== '', fn($qq) => $qq->where('total_amount', '>=', $min))
            ->when($max !== null && $max !== '', fn($qq) => $qq->where('total_amount', '<=', $max));
    }
}
