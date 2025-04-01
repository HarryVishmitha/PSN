<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductInventory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'product_variant_id',
        'product_subvariant_id',
        'quantity',
        'reorder_threshold',
        'unit_details',   // JSON column for extra details (e.g., {"width": "24in", "length": "50ft"})
        'provider_id',
        'last_updated',
        'created_by',
        'updated_by',
    ];

    // Cast the JSON details to an array.
    protected $casts = [
        'unit_details' => 'array',
    ];

    /**
     * Each inventory record belongs to a product.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Optionally, inventory may belong to a variant.
     */
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /**
     * Optionally, inventory may belong to a subvariant.
     */
    public function subvariant()
    {
        return $this->belongsTo(ProductSubvariant::class, 'product_subvariant_id');
    }

    /**
     * Each inventory record may have an associated provider.
     */
    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }
}
