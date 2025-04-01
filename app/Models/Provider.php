<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Provider extends Model
{
    use HasFactory;

    // Allow mass assignment for these fields.
    protected $fillable = [
        'name',
        'contact_info',
    ];

    /**
     * A provider supplies many rolls.
     */
    public function rolls()
    {
        return $this->hasMany(Roll::class);
    }

    /**
     * A provider is associated with many inventory records.
     */
    public function inventories()
    {
        return $this->hasMany(ProductInventory::class);
    }
}
