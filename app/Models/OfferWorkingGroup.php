<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class OfferWorkingGroup extends Model
{
    protected $table = 'offer_working_groups';
    protected $fillable = [
        'offer_id',
        'working_group_id',
    ];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function workingGroup(): BelongsTo
    {
        return $this->belongsTo(WorkingGroup::class, 'working_group_id');
    }
}
