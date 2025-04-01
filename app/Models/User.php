<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\CustomVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'working_group_id',  // New field
        'status',            // New field
        'phone_number',
        'profile_picture',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Use the standard property for casting attributes.
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'working_group_id'  => 'integer', // Ensure it's cast as an integer
        'status'            => 'string',
    ];

    /**
     * Send the email verification notification.
     *
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmail);
    }

    /**
     * Define the relationship with the Role model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Define the relationship with the WorkingGroup model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function workingGroup()
    {
        return $this->belongsTo(WorkingGroup::class);
    }

    /**
     * Define the relationship with our custom notifications using the pivot table 'notification_user'.
     *
     * Note: We name this relationship "customNotifications" to avoid conflict with Laravel's default notifications.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function customNotifications()
    {
        return $this->belongsToMany(\App\Models\Notification::class, 'notification_user')
                    ->withPivot('status', 'read_at')
                    ->withTimestamps();
    }
}
