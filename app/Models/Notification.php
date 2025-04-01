<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'message',
        'type',
        'is_global',
        'target_type', // New targeting column
        'target_id',   // New targeting column
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'notification_user')
                    ->withPivot('status', 'read_at')
                    ->withTimestamps();
    }
}
