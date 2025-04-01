<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductSubvariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_variant_id',
        'subvariant_name',   // e.g., "Color"
        'subvariant_value',  // e.g., "White", "Black"
        'price_adjustment',
        'created_by',
        'updated_by',
    ];

    /**
     * Each subvariant belongs to a primary variant.
     */
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
