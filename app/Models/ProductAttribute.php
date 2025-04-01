<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductAttribute extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'attribute_key',
        'attribute_value',
        'created_by',
        'updated_by',
    ];

    /**
     * Each attribute belongs to a product.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
