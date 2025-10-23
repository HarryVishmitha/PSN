<?php

namespace App\Notifications;

use App\Models\Estimate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Storage;

class EstimatePublishedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    // carry primitives only (queue-safe)
    public int $estimateId;
    public ?string $pdfPathOnDisk;
    public ?string $downloadUrl;

    public function __construct(int $estimateId, ?string $pdfPathOnDisk = null, ?string $downloadUrl = null)
    {
        $this->estimateId    = $estimateId;
        $this->pdfPathOnDisk = $pdfPathOnDisk;
        $this->downloadUrl   = $downloadUrl;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // Re-query fresh data (prevents stale snapshots and serialization bloat)
        $estimate = Estimate::findOrFail($this->estimateId);

        // If you want CC/BCC from config, you can add below
        $cc  = array_filter((array) config('mail.estimate_cc'));
        $bcc = array_filter((array) config('mail.estimate_bcc'));

        $viewData = [
            'estimate'    => $estimate,
            'downloadUrl' => $this->downloadUrl,
        ];

        $msg = (new MailMessage)
            ->subject('Your Quotation from Printair Advertising')
            // Use your Blade view:
            ->view('emails.quotation_published', $viewData);

        // Optional CC/BCC here (MailMessage supports it)
        if ($cc)  { $msg->cc($cc); }
        if ($bcc) { $msg->bcc($bcc); }

        // Attach PDF if available
        if ($this->pdfPathOnDisk && str_starts_with($this->pdfPathOnDisk, 'storage:')) {
            $relativePath = substr($this->pdfPathOnDisk, 8); // remove 'storage:'
            $absolutePath = Storage::disk('public')->path($relativePath);
            if (is_file($absolutePath)) {
                $msg->attach($absolutePath, [
                    'as'   => ($estimate->estimate_number ?? "Estimate-{$estimate->id}") . '.pdf',
                    'mime' => 'application/pdf',
                ]);
            }
        }

        return $msg;
    }
}
