<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class Statement extends Model
{
    protected $fillable = [
        'user_id',
        'working_group_id',
        'credit_term_id',
        'period_start',
        'period_end',
        'total_amount',
        'due_date',
        'status',
        'generated_at',
        'sent_at',
        'paid_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workingGroup(): BelongsTo
    {
        return $this->belongsTo(WorkingGroup::class);
    }

    public function creditTerm(): BelongsTo
    {
        return $this->belongsTo(CreditTerm::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StatementItem::class);
    }

    public function chequePayments(): HasMany
    {
        return $this->hasMany(ChequePayment::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(PaymentReminder::class);
    }
}
