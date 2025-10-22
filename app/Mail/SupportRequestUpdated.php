<?php

namespace App\Mail;

use App\Models\SupportRequest;
use App\Models\SupportRequestMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupportRequestUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public SupportRequest $supportRequest;
    public SupportRequestMessage $message;
    public string $trackingUrl;

    public function __construct(SupportRequest $supportRequest, SupportRequestMessage $message)
    {
        $this->supportRequest = $supportRequest->loadMissing(['files', 'messages.sender']);
        $this->message = $message;
        $this->trackingUrl = route('requests.track', $supportRequest->tracking_token);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Update on your request ' . $this->supportRequest->reference,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.support_requests.updated',
            with: [
                'request' => $this->supportRequest,
                'message' => $this->message,
                'trackingUrl' => $this->trackingUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

