<?php

namespace App\Mail;

use App\Models\Estimate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuotationPublished extends Mailable
{
    use Queueable, SerializesModels;

    public $estimate;
    public $viewUrl;
    public $downloadUrl;
    public $companyPhone;

    /**
     * Create a new message instance.
     */
    public function __construct(Estimate $estimate, ?string $downloadUrl = null)
    {
        // Eager load items with product relationship for the email template
        $this->estimate = $estimate->load(['items.product']);
        
        // Ensure download URL is absolute
        $this->downloadUrl = $downloadUrl ? config('app.url') . $downloadUrl : null;
        
        // Generate the view URL using the preview route (absolute URL for email)
        $this->viewUrl = config('app.url') . route('admin.estimate.preview', ['estimate' => $estimate->id], false);
        
        // Company phone - you can move this to config if needed
        $this->companyPhone = '+94 76 886 0175';
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Quotation ' . $this->estimate->estimate_number . ' from Printair',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.quotation_published',
            with: [
                'estimate' => $this->estimate,
                'viewUrl' => $this->viewUrl,
                'downloadUrl' => $this->downloadUrl,
                'companyPhone' => $this->companyPhone,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
