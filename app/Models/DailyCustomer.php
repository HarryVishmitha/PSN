<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyCustomer extends Model
{
    protected $fillable = [
        'full_name',
        'phone_number',
        'email',
        'address',
    ];
}
