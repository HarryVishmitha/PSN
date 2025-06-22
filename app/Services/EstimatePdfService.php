<?php

namespace App\Services;

use App\Models\Estimate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\Response;

class EstimatePdfService
{
    protected string $diskName;
    protected string $view;
    protected string $paper;
    protected string $orientation;

    public function __construct()
    {
        // you can publish a config/pdf.php or set these in your .env
        $this->diskName    = config('pdf.disk', 'public');
        $this->view        = config('pdf.estimate.template', 'pdfs.estimate');
        $this->paper       = config('pdf.estimate.paper_size', 'a4');
        $this->orientation = config('pdf.estimate.orientation', 'portrait');
    }

    /**
     * Build the relative storage path for an estimate.
     */
    protected function getRelativePath(Estimate $est): string
    {
        $slug = Str::slug($est->estimate_number);
        return "estimates/{$slug}.pdf";
    }

    /**
     * Has this PDF already been generated?
     */
    public function exists(int $estimateId): bool
    {
        $est = Estimate::findOrFail($estimateId);
        return Storage::disk($this->diskName)->exists($this->getRelativePath($est));
    }

    /**
     * Generate & store the PDF, or return the existing one if present.
     * @param  bool  $force  force regeneration even if it already exists
     * @return string  public URL to the PDF
     */
    public function generate(int $estimateId, bool $force = false): string
    {
        $est = Estimate::with(['items', 'customer', 'creator', 'workingGroup'])
                       ->findOrFail($estimateId);

        $path = $this->getRelativePath($est);
        $disk = Storage::disk($this->diskName);

        if (! $force && $disk->exists($path)) {
            return Storage::url($path);
        }

        $pdf = Pdf::loadView($this->view, compact('est'))
                  ->setPaper($this->paper, $this->orientation)
                  ->setOptions([
                      'isHtml5ParserEnabled' => true,
                      'isRemoteEnabled'      => true,
                      'dpi'                  => 150,
                  ]);

        //   store it
        $disk->put($path, $pdf->output());

        return Storage::url($path);
    }

    /**
     * Stream the PDF inline (for preview in-browser).
     */
    public function stream(int $estimateId): Response
    {
        $est = Estimate::with(['items', 'customer'])->findOrFail($estimateId);
        $pdf = Pdf::loadView($this->view, compact('est'))
                  ->setPaper($this->paper, $this->orientation);

        return response($pdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$est->estimate_number.'.pdf"',
        ]);
    }

    /**
     * Force a download of the PDF.
     */
    public function download(int $estimateId): Response
    {
        $est = Estimate::with(['items', 'customer'])->findOrFail($estimateId);
        $pdf = Pdf::loadView($this->view, compact('est'))
                  ->setPaper($this->paper, $this->orientation);

        return $pdf->download($est->estimate_number.'.pdf');
    }

    /**
     * Delete the stored PDF.
     */
    public function delete(int $estimateId): bool
    {
        $est = Estimate::findOrFail($estimateId);
        return Storage::disk($this->diskName)->delete($this->getRelativePath($est));
    }
}
