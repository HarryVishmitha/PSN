<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SupportRequest extends Model
{
    use HasFactory;

    public const STATUSES = [
        'approved',
        'in_review',
        'awaiting_customer',
        'completed',
        'closed',
    ];

    protected $guarded = [];

    protected $casts = [
        'specs' => 'array',
        'metadata' => 'array',
        'desired_date' => 'date',
        'approved_at' => 'datetime',
        'last_customer_reply_at' => 'datetime',
        'last_admin_reply_at' => 'datetime',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $request): void {
            if (empty($request->tracking_token)) {
                $request->tracking_token = (string) Str::ulid();
            }

            if (empty($request->reference)) {
                $request->reference = self::generateReference();
            }

            if (empty($request->status)) {
                $request->status = 'approved';
            }

            if ($request->status === 'approved' && empty($request->approved_at)) {
                $request->approved_at = now();
            }
        });
    }

    protected static function generateReference(): string
    {
        $prefix = 'REQ-' . now()->format('Ymd');
        $lastForToday = static::query()
            ->whereDate('created_at', now()->toDateString())
            ->latest('id')
            ->value('reference');

        $sequence = 1;

        if ($lastForToday && str_starts_with($lastForToday, $prefix)) {
            $parts = explode('-', $lastForToday);
            $sequence = isset($parts[2]) ? ((int) $parts[2] + 1) : 1;
        }

        return sprintf('%s-%04d', $prefix, $sequence);
    }

    public function scopeTrackingToken(Builder $query, string $token): Builder
    {
        return $query->where('tracking_token', $token);
    }

    public function files(): HasMany
    {
        return $this->hasMany(SupportRequestFile::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportRequestMessage::class)->orderBy('created_at');
    }

    public function latestMessage(): ?SupportRequestMessage
    {
        return $this->messages()->latest()->first();
    }
}
