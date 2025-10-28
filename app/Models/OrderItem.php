<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class OrderItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'subvariant_id',
        'name',
        'description',
        'pricing_method',
        'unit',
        'size_unit',
        'width',
        'height',
        'quantity',
        'unit_price',
        'line_total',
        'is_roll',
        'roll_id',
        'cut_width_in',
        'cut_height_in',
        'offcut_price_per_sqft',
        'options',
        'design_id',
        'user_design_upload_id',
        'hire_designer',
    ];

    protected $casts = [
        'options'        => 'array',
        'hire_designer'  => 'boolean',
        'is_roll'        => 'boolean',
        'unit_price'     => 'decimal:2',
        'line_total'     => 'decimal:2',
        'quantity'       => 'decimal:3',
        'width'          => 'decimal:3',
        'height'         => 'decimal:3',
        'cut_width_in'          => 'decimal:3',
        'cut_height_in'         => 'decimal:3',
        'offcut_price_per_sqft' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
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

    public function design(): HasOne
    {
        return $this->hasOne(OrderItemDesign::class);
    }

    public function shipments(): BelongsToMany
    {
        return $this->belongsToMany(Shipment::class, 'shipment_items')
                    ->withPivot('quantity')
                    ->withTimestamps();
    }
}
