<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class Offer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'image',
        'code',
        'offer_type',
        'discount_value',
        'min_purchase_amt',
        'start_date',
        'end_date',
        'usage_limit',
        'per_customer_limit',
        'status',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'discount_value' => 'decimal:2',
        'min_purchase_amt' => 'decimal:2',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'offer_products');
    }

    public function workingGroups(): BelongsToMany
    {
        return $this->belongsToMany(WorkingGroup::class, 'offer_working_groups');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(OfferUsage::class);
    }
}
