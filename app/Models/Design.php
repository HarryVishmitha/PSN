<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Design extends Model
{
    use HasFactory, SoftDeletes;

    // ---- NEW: helpful constants (optional) ----
    public const ACCESS_PUBLIC  = 'working_group';
    public const STATUS_ACTIVE  = 'active';

    protected $fillable = [
        'name',
        'description',
        'width',
        'height',
        'product_id',
        'image_url',
        'access_type',
        'working_group_id',
        'status',
        'created_by',
        'updated_by',
    ];

    /**
     * Get the working group associated with the design (if applicable).
     */
    public function workingGroup()
    {
        return $this->belongsTo(WorkingGroup::class);
    }

    /**
     * Get the user who created the design.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the design.
     */
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the design access entries for restricted designs.
     */
    public function designAccesses()
    {
        return $this->hasMany(DesignAccess::class);
    }

    /**
     * Design must bind to a product
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /** Only “active” designs (string status column) */
    public function scopeActive($q)
    {
        return $q->where('status', self::STATUS_ACTIVE);
        // If status is tinyint(1): return $q->where('status', 1);
    }

    /** Only designs that are globally public (access_type = 'public') */
    public function scopePublicAccess($q)
    {
        return $q->where('access_type', self::ACCESS_PUBLIC);
    }

    /** Restrict to ‘public’ working group by name (case-insensitive) */
    public function scopeInPublicWorkingGroup($q)
    {
        return $q->whereHas('workingGroup', function ($wq) {
            $wq->whereRaw('LOWER(name) = ?', ['public']);
        });
    }

    /** Restrict to a given product (accepts id or model) */
    public function scopeForProduct($q, $product)
    {
        $productId = $product instanceof Product ? $product->getKey() : $product;
        return $q->where('product_id', $productId);
    }

    /** One-liner you can reuse anywhere the catalog needs public designs */
    public function scopePublicCatalog($q)
    {
        return $q->active()->publicAccess()->inPublicWorkingGroup();
        // SoftDeletes automatically excludes deleted rows unless withTrashed() is used.
    }
}
