<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = ['title','description','start_at','end_at','location','visibility','created_by'];
    protected $casts = ['start_at'=>'datetime','end_at'=>'datetime'];

    public function creator(){ return $this->belongsTo(User::class, 'created_by'); }
    public function attendees(){ return $this->belongsToMany(User::class, 'event_user')->withTimestamps()->withPivot('status'); }
}
