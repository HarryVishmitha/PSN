<?php

// app/Services/EstimatePdfService.php
namespace App\Services;

use App\Models\Estimate;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class EstimatePdfService
{
    public function generate(int $estimateId, bool $save = true): array|\Symfony\Component\HttpFoundation\Response
    {
        $estimate = Estimate::with(['items.product', 'customer', 'workingGroup'])->findOrFail($estimateId);
        $payments = PaymentMethod::where([
            'status' => 'active',
            'type' => 'static',
            'flow' => 'manual',
        ])->get()->map(function ($method) {
            $cfg = $method->config ?? [];

            return [
                'display_name'   => $method->display_name ?? $method->code,
                'instructions'   => $method->instructions ?? '',
                'bank_name'      => $cfg['bank_name'] ?? null,
                'branch'         => $cfg['branch'] ?? null,
                'account_name'   => $cfg['account_name'] ?? null,
                'account_number' => $cfg['account_number'] ?? null,
                'swift'          => $cfg['swift'] ?? null,
            ];
        });

        $pdf = Pdf::loadView('pdfs.estimate', [
            'estimate' => $estimate,
            'payments' => $payments,
        ]);

        $filename = $estimate->estimate_number . '.pdf';
        $path = 'estimates/' . $filename;

        if ($save) {
            Storage::disk('public')->put($path, $pdf->output());

            $size = Storage::disk('public')->exists($path)
                ? Storage::disk('public')->size($path)
                : null;

            return [
                'url'       => Storage::url($path),
                'path'      => $path,
                'disk'      => 'public',
                'filename'  => $filename,
                'size'      => $size,
                'mime_type' => 'application/pdf',
            ];
        }

        return $pdf->download($filename);
    }
}
