<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DesignShareLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'token',
        'password_hash',
        'expires_at',
        'view_limit',
        'view_count',
        'created_by',
    ];

    protected $dates = ['expires_at'];

    // Relations
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
