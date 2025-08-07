<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProductView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['product_id', 'ip_address', 'viewed_at'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
