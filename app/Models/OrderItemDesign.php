<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class OrderItemDesign extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_item_id','design_id','custom_request','status',
    ];

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function design(): BelongsTo
    {
        return $this->belongsTo(Design::class);
    }
}

