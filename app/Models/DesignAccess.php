<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DesignAccess extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'design_access';

    protected $fillable = [
        'design_id',
        'user_id',
    ];

    /**
     * Get the design associated with this access entry.
     */
    public function design()
    {
        return $this->belongsTo(Design::class);
    }

    /**
     * Get the user who has been granted access.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
