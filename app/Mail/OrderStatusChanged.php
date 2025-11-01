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

class OrderStatusChanged extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Order $order;
    public string $oldStatus;
    public string $newStatus;
    protected $template;
    protected $renderer;
    protected $renderedContent;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, string $oldStatus, string $newStatus)
    {
        $this->order = $order->loadMissing(['items', 'workingGroup']);
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->renderer = app(TemplateRenderer::class);
        
        // Load template
        $this->template = MessageTemplate::where('slug', 'order-status-update-customer-email')
            ->where('is_active', true)
            ->first();

        // Render template if available
        if ($this->template) {
            $this->renderedContent = $this->renderer->renderForOrder($this->template, $this->order, [
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->renderedContent['subject'] ?? 'Order #' . $this->order->id . ' Status Update';
        
        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // if ($this->template) {
        //     return new Content(
        //         text: 'emails.template-text',
        //         with: [
        //             'content' => $this->renderedContent['body'],
        //             'order' => $this->order,
        //         ]
        //     );
        // }

        // Fallback to the branded HTML view
        return new Content(
            html: 'emails.order-status-changed',
            with: [
                'order' => $this->order,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
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
