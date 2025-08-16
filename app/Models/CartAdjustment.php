<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int                         $id
 * @property int                         $cart_id
 * @property string                      $type     // discount|shipping|fee|tax
 * @property string|null                 $code
 * @property string|null                 $label
 * @property string                      $amount   // signed: discount negative
 * @property array|null                  $meta
 * @property \Illuminate\Support\Carbon  $created_at
 * @property \Illuminate\Support\Carbon  $updated_at
 *
 * @property-read \App\Models\Cart       $cart
 */
class CartAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
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

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }
}
