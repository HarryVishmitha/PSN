<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class Estimate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'customer_type','customer_id','working_group_id','status',
        'valid_from','valid_to','billing_address_id',
        'subtotal_amount','discount_amount','tax_amount','total_amount',
        'created_by','published_at',
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
}
