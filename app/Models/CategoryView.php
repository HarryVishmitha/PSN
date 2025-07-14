<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\{BelongsTo, HasMany, BelongsToMany, MorphTo};

class CategoryView extends Model
{
    // If you want to disable Laravel's timestamps and only use viewed_at
    public $timestamps = false;

    protected $fillable = [
        'category_id',
        'user_id',
        'ip_address',
        'viewed_at',
    ];

    protected $dates = ['viewed_at'];

    // Relations

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
