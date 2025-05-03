<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class CreditTerm extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'working_group_id',
        'credit_limit',
        'billing_cycle',
        'billing_day',
        'custom_term_days',
        'created_by',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workingGroup(): BelongsTo
    {
        return $this->belongsTo(WorkingGroup::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function statements(): HasMany
    {
        return $this->hasMany(Statement::class);
    }
}
