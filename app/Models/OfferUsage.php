<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class OfferUsage extends Model
{
    protected $table = 'offer_usages';
    protected $fillable = [
        'offer_id',
        'customer_type',
        'customer_id',
        'times_used',
        'last_used_at',
    ];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function customer(): MorphTo
    {
        return $this->morphTo();
    }
}
