<?php

// app/Models/UserDesignUpload.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDesignUpload extends Model
{
    protected $fillable = [
        'product_id',
        'user_id',
        'session_id',
        'type',
        'external_url',
        'file_path',
        'original_filename',
        'mime_type',
        'size_bytes',
        'image_url',
        'note',
        'status',
        'review_notes',
        'cart_item_id',
        'order_item_id',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function cartItem()
    {
        return $this->belongsTo(CartItem::class);
    }
    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }
}
