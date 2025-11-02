<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class OrderStatusChanged extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Order $order;
    public string $oldStatus;
    public string $newStatus;
    protected ?string $trackingUrl = null;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, string $oldStatus, string $newStatus)
    {
        $this->order = $order->loadMissing(['items', 'workingGroup']);
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;

        $this->order->ensureTrackingToken();
        $this->order->refresh();

        if (!empty($this->order->tracking_token)) {
            $this->trackingUrl = URL::temporarySignedRoute(
                'order-tracking.orders.show',
                now()->addDays(7),
                [
                    'order' => $this->order->id,
                    'token' => $this->order->tracking_token,
                ]
            );
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $orderNumber = $this->order->number ?? sprintf('ORD-%05d', $this->order->id);
        $subject = 'Order ' . $orderNumber . ' - Status Update';

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.order-status-changed',
            with: [
                'order' => $this->order,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
                'trackingUrl' => $this->trackingUrl,
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
