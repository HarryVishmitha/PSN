<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = ['title','description','status','priority','created_by','assigned_to','due_date'];

    protected $casts = ['due_date' => 'datetime'];

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function assignee(){ return $this->belongsTo(User::class, 'assigned_to'); }
    public function collaborators(){ return $this->belongsToMany(User::class, 'task_user')->withTimestamps(); }
    public function comments(){ return $this->hasMany(TaskComment::class); }
}
