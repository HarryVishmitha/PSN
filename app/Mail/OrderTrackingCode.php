<?php

namespace App\Mail;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderTrackingCode extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    public Order $order;
    public string $code;
    public Carbon $expiresAt;

    public function __construct(Order $order, string $code, Carbon $expiresAt)
    {
        $this->order = $order;
        $this->code = $code;
        $this->expiresAt = $expiresAt;
    }

    public function build(): self
    {
        return $this
            ->subject('Your order tracking verification code')
            ->markdown('emails.order-tracking-code', [
                'order' => $this->order,
                'code' => $this->code,
                'expiresAt' => $this->expiresAt,
            ]);
    }
}
