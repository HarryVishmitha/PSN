<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class PaymentReminder extends Model
{
    protected $fillable = [
        'statement_id',
        'reminder_date',
        'reminder_type',
        'notes',
        'sent',
        'created_by',
    ];

    public function statement(): BelongsTo
    {
        return $this->belongsTo(Statement::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
