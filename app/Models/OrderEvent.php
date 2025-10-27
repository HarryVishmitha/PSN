<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderEvent extends Model
{
    public const VISIBILITY_ADMIN = 'admin';
    public const VISIBILITY_CUSTOMER = 'customer';
    public const VISIBILITY_PUBLIC = 'public';

    protected $fillable = [
        'order_id',
        'event_type',
        'visibility',
        'old_status',
        'new_status',
        'title',
        'message',
        'data',
        'created_by',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

