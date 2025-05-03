<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class ExpenseAttachment extends Model
{
    protected $fillable = [
        'expense_id',
        'file_url',
        'file_type',
    ];

    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class, 'expense_id');
    }
}

