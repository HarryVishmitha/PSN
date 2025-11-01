<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\MessageTemplate;
use App\Services\TemplateRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderPlacedCustomer extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Order $order;
    protected $template;
    protected $renderer;
    protected $renderedContent;

    public function __construct(Order $order)
    {
        $this->order = $order->loadMissing(['items', 'shippingAddress', 'workingGroup']);
        $this->renderer = app(TemplateRenderer::class);
        
        // Load template
        $this->template = MessageTemplate::where('slug', 'order-placed-customer-email')
            ->where('is_active', true)
            ->first();

        // Render template if available
        if ($this->template) {
            $this->renderedContent = $this->renderer->renderForOrder($this->template, $this->order);
        }
    }

    public function envelope(): Envelope
    {
        // Use template subject if available, otherwise fallback
        $subject = $this->renderedContent['subject'] ?? 'We received your order #' . $this->order->id;
        
        return new Envelope(
            subject: $subject
        );
    }

    public function content(): Content
    {
        // If template exists, use text content, otherwise fallback to markdown view
        if ($this->template) {
            return new Content(
                text: 'emails.template-text',
                with: [
                    'content' => $this->renderedContent['body'],
                    'order' => $this->order,
                ]
            );
        }

        // Fallback to original markdown view
        return new Content(
            markdown: 'emails.orders.placed-customer',
            with: [
                'order' => $this->order,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

