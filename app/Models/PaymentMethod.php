<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentMethod extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code','display_name','type','flow','status','locked','logo_path',
        'instructions','fee_type','fee_value','min_order_total','max_order_total',
        'allowed_currencies','config','sort_order',
    ];

    protected $casts = [
        'locked' => 'boolean',
        'allowed_currencies' => 'array',
        'config' => 'array',
        'fee_value' => 'decimal:2',
        'min_order_total' => 'decimal:2',
        'max_order_total' => 'decimal:2',
    ];

    // Scopes
    public function scopeActive($q) { return $q->where('status','active'); }
    public function scopeSearch($q, ?string $term) {
        if (!$term) return $q;
        return $q->where(function($qq) use ($term){
            $qq->where('display_name','like',"%$term%")
               ->orWhere('code','like',"%$term%");
        });
    }
    public function scopeFilter($q, array $filters) {
        if (!empty($filters['status'])) $q->where('status', $filters['status']);
        if (!empty($filters['type']))   $q->where('type', $filters['type']);
        if (!empty($filters['flow']))   $q->where('flow', $filters['flow']);
        return $q;
    }

    // Helper: compute fee from subtotal
    public function computeFee(float $subtotal): float {
        if ($this->fee_type === 'flat')    return (float) $this->fee_value;
        if ($this->fee_type === 'percent') return round($subtotal * ((float)$this->fee_value/100), 2);
        return 0.0;
    }

    // Guard list for locked methods
    public static function lockedImmutableFields(): array {
        return ['code','type','flow'];
    }
    public function scopeStaticOrManual($q) { return $q->whereIn('type', ['static','manual']); }
}
