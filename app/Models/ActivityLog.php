<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'action_type',
        'description',
        'ip_address',
    ];

    /**
     * Get the user associated with the activity log.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
