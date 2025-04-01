<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'working_group_id',
        'name',
        'description',
        'price',            // For standard (non-roll) products.
        'pricing_method',   // 'standard' or 'roll'
        'price_per_sqft',   // For roll-based products.
        'unit_of_measure',
        'metadata',         // JSON data (e.g., dimensions, material, etc.)
        'meta_title',
        'meta_description',
        'created_by',
        'updated_by',
    ];

    // Cast JSON columns to arrays.
    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * A product can belong to many categories.
     */
    public function categories()
    {
        return $this->belongsToMany(Category::class, 'product_categories');
    }

    /**
     * A product has many images.
     */
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    /**
     * A product may have multiple variants.
     */
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * A product can have many inventory records.
     */
    public function inventories()
    {
        return $this->hasMany(ProductInventory::class);
    }

    /**
     * A product belongs to a working group.
     */
    public function workingGroup()
    {
        return $this->belongsTo(WorkingGroup::class);
    }
}
