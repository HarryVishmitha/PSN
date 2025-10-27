<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class OrderPlacedAdminDb extends Notification implements ShouldQueue
{
    use Queueable;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $contact = trim(($this->order->contact_first_name ?? '') . ' ' . ($this->order->contact_last_name ?? ''));

        return [
            'order_id' => $this->order->id,
            'title' => 'New order received',
            'body' => sprintf(
                'Order #%d placed by %s (%s)',
                $this->order->id,
                $contact !== '' ? $contact : 'guest',
                $this->order->contact_email ?? 'no email'
            ),
            'grand_total' => $this->order->total_amount ?? $this->order->grand_total ?? null,
            'url' => url('/admin/orders/' . $this->order->id),
        ];
    }
}
