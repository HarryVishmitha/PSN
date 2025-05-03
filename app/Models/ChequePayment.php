<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class ChequePayment extends Model
{
    protected $fillable = [
        'statement_id',
        'user_id',
        'working_group_id',
        'cheque_number',
        'bank_name',
        'cheque_date',
        'amount',
        'status',
        'deposit_date',
        'created_by',
    ];

    public function statement(): BelongsTo
    {
        return $this->belongsTo(Statement::class);
    }

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
}

