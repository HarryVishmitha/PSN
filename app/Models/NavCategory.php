<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NavCategory extends Model
{
    use HasFactory;

    protected $table = 'nav_categories';

    protected $fillable = [
        'category_id',
        'nav_order',
        'is_visible',
    ];

    /**
     * Relationship to the main Category model
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
