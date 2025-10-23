<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class SupportRequestFile extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'size' => 'integer',
    ];

    protected $appends = [
        'url',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(SupportRequest::class, 'support_request_id');
    }

    public function getUrlAttribute(): ?string
    {
        if (!$this->path) {
            return null;
        }

        return Storage::disk($this->disk)->url($this->path);
    }
}

