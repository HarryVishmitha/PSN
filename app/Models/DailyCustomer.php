<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Address;
use App\Models\Estimate;
use App\Models\Order;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Relations\{
    MorphMany, MorphTo, BelongsTo, BelongsToMany, HasMany, HasOne
};

class DailyCustomer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'full_name', 'phone_number', 'email', 'address', 'notes', 'visit_date', 'working_group_id',
    ];

    public function addresses(): MorphMany
    {
        return $this->morphMany(Address::class, 'addressable');
    }

    public function estimates(): MorphMany
    {
        return $this->morphMany(Estimate::class, 'customer');
    }

    public function orders(): MorphMany
    {
        return $this->morphMany(Order::class, 'customer');
    }

    public function invoices(): MorphMany
    {
        return $this->morphMany(Invoice::class, 'customer');
    }
    public function workingGroup()
    {
        return $this->belongsTo(WorkingGroup::class);
    }
}
