<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class StatementItem extends Model
{
    protected $fillable = [
        'statement_id',
        'invoice_id',
        'invoice_amount',
    ];

    public function statement(): BelongsTo
    {
        return $this->belongsTo(Statement::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
