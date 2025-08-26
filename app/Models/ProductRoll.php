<?php

// app/Models/ProductRoll.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductRoll extends Model
{
    protected $table = 'product_rolls';

    protected $fillable = [
        'product_id',
        'roll_id',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    // Relationships
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function roll()
    {
        return $this->belongsTo(Roll::class);
    }

    // Scopes / helpers
    public function scopeDefault($q)
    {
        return $q->where('is_default', true);
    }
}
