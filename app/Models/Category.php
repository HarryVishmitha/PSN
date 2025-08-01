<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'img_link',
        'active',
        'created_by',
        'updated_by',
    ];

    /**
     * A category can be assigned to many products.
     */
    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_categories');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
    public function views()
    {
        return $this->hasMany(CategoryView::class);
    }
    public function nav()
    {
        return $this->hasOne(NavCategory::class);
    }
}
