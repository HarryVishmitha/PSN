<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int                         $id
 * @property int                         $cart_item_id
 * @property string                      $type     // discount|surcharge|fee|tax
 * @property string|null                 $code
 * @property string|null                 $label
 * @property string                      $amount   // signed: discount negative
 * @property array|null                  $meta
 * @property \Illuminate\Support\Carbon  $created_at
 * @property \Illuminate\Support\Carbon  $updated_at
 *
 * @property-read \App\Models\CartItem   $item
 */
class CartItemAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_item_id',
        'type',
        'code',
        'label',
        'amount',
        'meta',
    ];

    protected $casts = [
        'meta'   => 'array',
        'amount' => 'decimal:2',
    ];

    public function item()
    {
        return $this->belongsTo(CartItem::class, 'cart_item_id');
    }
}
