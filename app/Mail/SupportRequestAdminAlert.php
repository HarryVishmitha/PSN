<?php

namespace App\Mail;

use App\Models\SupportRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupportRequestAdminAlert extends Mailable
{
    use Queueable, SerializesModels;

    public SupportRequest $supportRequest;
    public string $adminUrl;

    public function __construct(SupportRequest $supportRequest)
    {
        $this->supportRequest = $supportRequest->loadMissing('files');
        $this->adminUrl = route('admin.requests.show', $supportRequest);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New customer request ' . $this->supportRequest->reference,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.support_requests.admin_alert',
            with: [
                'request' => $this->supportRequest,
                'adminUrl' => $this->adminUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

