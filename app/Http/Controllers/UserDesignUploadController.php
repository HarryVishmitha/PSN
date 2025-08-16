<?php

namespace App\Http\Controllers;

use App\Models\UserDesignUpload;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class UserDesignUploadController extends Controller
{
    /** Create or fetch a sticky session id even for guests (requires session middleware) */
    protected function sessionId(Request $req): string
    {
        if (!$req->session()->has('_ud_sess')) {
            $req->session()->put('_ud_sess', bin2hex(random_bytes(16)));
        }
        return (string) $req->session()->get('_ud_sess');
    }

    /** POST /api/design-uploads */
    public function storeFile(Request $req)
    {
        try {
            $data = $req->validate([
                'product_id' => ['required', 'exists:products,id'],
                'file'       => ['required', 'file', 'max:25600', 'mimes:pdf,ai,eps,psd,svg,png,jpg,jpeg,tiff,tif,webp'],
                'note'       => ['nullable', 'string', 'max:2000'],
            ]);

            // Ensure product exists (extra guard in case product was soft-deleted)
            $product = Product::query()->findOrFail($data['product_id']);

            // Store
            $disk = 'public';
            $path = $req->file('file')->store('user_design_uploads', $disk);

            $upload = UserDesignUpload::create([
                'product_id'        => $product->id,
                'user_id'           => optional($req->user())->id,
                'session_id'        => $this->sessionId($req),
                'type'              => 'file',
                'file_path'         => $path,
                'original_filename' => $req->file('file')->getClientOriginalName(),
                'mime_type'         => $req->file('file')->getClientMimeType(),
                'size_bytes'        => $req->file('file')->getSize(),
                'note'              => $data['note'] ?? null,
                'status'            => 'pending',
            ]);

            // Build a public URL (absolute)
            $fileUrl = asset('storage/' . ltrim($path, '/'));

            return response()->json([
                'ok'         => true,
                'type'       => 'file',
                'upload_id'  => $upload->id,
                'file_url'   => $fileUrl,
                'message'    => 'Uploaded successfully',
            ], 201);
        } catch (ValidationException $ve) {
            // Laravel will make a 422 JSON automatically, but we return compact shape for SPA
            return response()->json([
                'ok'      => false,
                'message' => collect($ve->errors())->flatten()->first() ?: 'Validation failed.',
                'errors'  => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('[UserDesignUploadController.storeFile] ' . $e->getMessage(), ['ex' => $e]);
            return response()->json([
                'ok'      => false,
                'message' => 'Upload failed. Please try again.',
            ], 500);
        }
    }

    /** POST /api/design-links */
    public function storeLink(Request $req)
    {
        try {
            $data = $req->validate([
                'product_id' => ['required', 'exists:products,id'],
                'url'        => ['required', 'url', 'max:2000'],
                'note'       => ['nullable', 'string', 'max:2000'],
            ]);

            // (Optional) check host against a known list to help support
            $host = parse_url($data['url'], PHP_URL_HOST) ?: '';
            $known = ['drive.google.com', 'dropbox.com', 'onedrive.live.com', '1drv.ms', 'wetransfer.com'];

            $upload = UserDesignUpload::create([
                'product_id'   => (int)$data['product_id'],
                'user_id'      => optional($req->user())->id,
                'session_id'   => $this->sessionId($req),
                'type'         => 'link',
                'external_url' => $data['url'],
                'note'         => $data['note'] ?? null,
                'status'       => 'pending',
                'meta'         => ['host' => $host, 'is_known_host' => in_array($host, $known, true)],
            ]);

            return response()->json([
                'ok'        => true,
                'type'      => 'link',
                'upload_id' => $upload->id,
                'url'       => $data['url'],
                'message'   => 'Link saved',
            ], 201);
        } catch (ValidationException $ve) {
            return response()->json([
                'ok'      => false,
                'message' => collect($ve->errors())->flatten()->first() ?: 'Validation failed.',
                'errors'  => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('[UserDesignUploadController.storeLink] ' . $e->getMessage(), ['ex' => $e]);
            return response()->json([
                'ok'      => false,
                'message' => 'Could not save the link. Please try again.',
            ], 500);
        }
    }

    /** Optional: record "hire a designer" choice (no redirect) */
    public function storeHire(Request $req)
    {
        try {
            $data = $req->validate([
                'product_id' => ['required', 'exists:products,id'],
                'note'       => ['nullable', 'string', 'max:2000'],
            ]);

            $upload = UserDesignUpload::create([
                'product_id' => (int)$data['product_id'],
                'user_id'    => optional($req->user())->id,
                'session_id' => $this->sessionId($req),
                'type'       => 'hire',
                'status'     => 'pending',
                'note'       => $data['note'] ?? null,
            ]);

            return response()->json([
                'ok'        => true,
                'type'      => 'hire',
                'upload_id' => $upload->id,
                'message'   => 'Request noted. Our team will reach out.',
            ], 201);
        } catch (ValidationException $ve) {
            return response()->json([
                'ok'      => false,
                'message' => collect($ve->errors())->flatten()->first() ?: 'Validation failed.',
                'errors'  => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            Log::error('[UserDesignUploadController.storeHire] ' . $e->getMessage(), ['ex' => $e]);
            return response()->json([
                'ok'      => false,
                'message' => 'Could not record your request. Please try again.',
            ], 500);
        }
    }
}
