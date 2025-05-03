<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class TaxRate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'rate',
        'type',
        'jurisdiction',
        'created_by',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function invoiceItemTaxes(): HasMany
    {
        return $this->hasMany(InvoiceItemTax::class);
    }
}

