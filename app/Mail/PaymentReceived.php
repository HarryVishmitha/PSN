<?php

namespace App\Mail;

use App\Models\PaymentRequest;
use App\Models\MessageTemplate;
use App\Services\TemplateRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceived extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public PaymentRequest $paymentRequest;
    protected $template;
    protected $renderer;
    protected $renderedContent;

    /**
     * Create a new message instance.
     */
    public function __construct(PaymentRequest $paymentRequest)
    {
        $this->paymentRequest = $paymentRequest->loadMissing(['order.items', 'order.workingGroup', 'paidBy']);
        $this->renderer = app(TemplateRenderer::class);
        
        // Load template
        $this->template = MessageTemplate::where('slug', 'payment-received-customer-email')
            ->where('is_active', true)
            ->first();

        // Render template if available
        if ($this->template) {
            $this->renderedContent = $this->renderer->renderForPaymentRequest($this->template, $this->paymentRequest);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->renderedContent['subject'] ?? 'Payment Received - Order #' . $this->paymentRequest->order_id;
        
        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        if ($this->template) {
            return new Content(
                text: 'emails.template-text',
                with: [
                    'content' => $this->renderedContent['body'],
                    'paymentRequest' => $this->paymentRequest,
                ]
            );
        }

        // Fallback to a simple text view
        return new Content(
            text: 'emails.payment-received',
            with: [
                'paymentRequest' => $this->paymentRequest,
            ]
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
