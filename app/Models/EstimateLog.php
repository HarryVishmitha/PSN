<?php

// app/Models/EstimateLog.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstimateLog extends Model
{
    protected $fillable = [
        'estimate_id','actor_id','type','from_status','to_status','payload','ip_address',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
