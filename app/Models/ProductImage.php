<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductImage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'image_url',
        'image_order',
        'is_primary',
        'alt_text',
        'created_by',
        'updated_by',
    ];

    /**
     * Each image belongs to a product.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
