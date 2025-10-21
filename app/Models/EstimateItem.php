<?php

// app/Models/EstimateItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstimateItem extends Model
{
    protected $fillable = [
        'estimate_id',
        'product_id',
        'variant_id',
        'subvariant_id',
        'description',
        'unit',
        'quantity',
        'unit_price',
        'line_total',
        'is_roll',
        'roll_id',
        'cut_width_in',
        'cut_height_in',
        'offcut_price_per_sqft',
    ];

    protected $casts = [
        'quantity'              => 'decimal:3',
        'unit_price'            => 'decimal:2',
        'line_total'            => 'decimal:2',
        'is_roll'               => 'boolean',
        'cut_width_in'          => 'decimal:2',
        'cut_height_in'         => 'decimal:2',
        'offcut_price_per_sqft' => 'decimal:2',
    ];

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
    public function subvariant(): BelongsTo
    {
        return $this->belongsTo(ProductSubvariant::class, 'subvariant_id');
    }
    public function roll(): BelongsTo
    {
        return $this->belongsTo(Roll::class);
    }
}
