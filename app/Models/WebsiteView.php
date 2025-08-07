<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteView extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'referrer',
        'visited_url',
        'visited_at',
    ];

    protected $dates = ['visited_at'];
}
