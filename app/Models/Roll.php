<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Roll extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider_id',
        'roll_type',            // e.g., "Flex", "Sticker", "Canvas"
        'roll_size',            // e.g., "2ft", "3ft", "4ft" (optional)
        'roll_width',
        'roll_height',
        'price_rate_per_sqft',
    ];

    /**
     * Each roll belongs to a provider.
     */
    public function provider()
    {
        return $this->belongsTo(Provider::class);
    }
}
