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
        'size_unit',
        'width',
        'height',
        'quantity',
        'unit_price',
        'line_total',
        'options',
        'design_id',
        'user_design_upload_id',
        'hire_designer',
    ];

    protected $casts = [
        'options'        => 'array',
        'hire_designer'  => 'boolean',
        'unit_price'     => 'decimal:2',
        'line_total'     => 'decimal:2',
        'width'          => 'decimal:3',
        'height'         => 'decimal:3',
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
