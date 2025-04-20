<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Design extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
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
}
