<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Address stored polymorphically for many models (Cart, User, etc.)
 *
 * Columns:
 * - addressable_type:string
 * - addressable_id:unsignedBigInt
 * - type: enum('billing','shipping')
 * - line1,line2,city,region,postal_code,country
 * - timestamps, soft deletes
 */
class Address extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'addressable_type',
        'addressable_id',
        'type',
        'line1',
        'line2',
        'city',
        'region',
        'postal_code',
        'country',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    public function addressable()
    {
        return $this->morphTo();
    }

    /** Quick presenters */
    public function oneLine(): string
    {
        return collect([$this->line1, $this->line2, $this->city, $this->region, $this->postal_code, $this->country])
            ->filter()
            ->implode(', ');
    }
}
