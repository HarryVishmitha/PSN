<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'variant_name',    // e.g., "Size"
        'variant_value',   // e.g., "Large", "Small"
        'price_adjustment',
        'created_by',
        'updated_by',
    ];

    /**
     * Each variant belongs to a product.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * A variant can have many subvariants.
     */
    public function subvariants()
    {
        return $this->hasMany(ProductSubvariant::class);
    }
}
