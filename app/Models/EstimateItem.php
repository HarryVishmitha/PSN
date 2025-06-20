<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class EstimateItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'estimate_id',
        'product_id',
        'variant_id',
        'subvariant_id',
        'description',
        'quantity',
        'unit_price',
        'line_total',
        // new roll-cut fields:
        'roll_id',
        'is_roll',
        'cut_width_in',
        'cut_height_in',
        'offcut_price_per_sqft',
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
