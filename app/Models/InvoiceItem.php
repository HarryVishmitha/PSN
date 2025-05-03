<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class InvoiceItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_id','product_id','variant_id','subvariant_id','quantity','unit_price','line_total',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    public function subvariant(): BelongsTo
    {
        return $this->belongsTo(ProductSubvariant::class, 'subvariant_id');
    }

    public function taxes(): HasMany
    {
        return $this->hasMany(InvoiceItemTax::class);
    }
}
