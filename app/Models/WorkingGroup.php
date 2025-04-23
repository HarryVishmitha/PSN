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
    /**
     * A working-group has many products.
     */
    public function products()
    {
        return $this->hasMany(Product::class, 'working_group_id')->where('status', 'published')->whereNull('deleted_at')->orderBy('name');
    }
}
