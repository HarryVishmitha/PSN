<?php

namespace App\Mail;

use App\Models\SupportRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupportRequestSubmitted extends Mailable
{
    use Queueable, SerializesModels;

    public SupportRequest $supportRequest;
    public string $trackingUrl;

    public function __construct(SupportRequest $supportRequest)
    {
        $this->supportRequest = $supportRequest->loadMissing('files');
        $this->trackingUrl = route('requests.track', $supportRequest->tracking_token);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'We received your request ' . $this->supportRequest->reference,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.support_requests.submitted',
            with: [
                'request' => $this->supportRequest,
                'trackingUrl' => $this->trackingUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

