<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Auth\Notifications\VerifyEmail as LaravelVerifyEmail;

class CustomVerifyEmail extends LaravelVerifyEmail
{
    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        return (new MailMessage)
                    ->subject('Verify Your Email Address') // Customize the subject
                    ->view('emails.custom-verify', ['url' => $this->verificationUrl($notifiable)]) // Set the custom view
                    ->line('Please click the button below to verify your email address.');
    }
}
