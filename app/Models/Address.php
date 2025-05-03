<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class Address extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'addressable_type', 'addressable_id', 'type',
        'line1', 'line2', 'city', 'region', 'postal_code', 'country',
    ];

    public function addressable(): MorphTo
    {
        return $this->morphTo();
    }
}

