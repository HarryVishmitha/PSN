<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WorkingGroup extends Model
{
    use HasFactory;

    // Specify the fields that can be mass-assigned
    protected $fillable = [
        'name',
        'description',
        'wg_image',
        'status',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
