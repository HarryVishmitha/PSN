<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupportRequestRequest;
use App\Http\Resources\SupportRequestResource;
use App\Mail\SupportRequestAdminAlert;
use App\Mail\SupportRequestSubmitted;
use App\Models\SupportRequest;
use App\Models\SupportRequestFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SupportRequestController extends Controller
{
    public function create(Request $request): Response|JsonResponse
    {
        $payload = [
            'categories' => collect(config('support-requests.categories'))
                ->map(fn(array $value, string $key) => [
                    'value' => $key,
                    'label' => $value['label'] ?? ucfirst(str_replace('-', ' ', $key)),
                ])
                ->values(),
            'maxFiles' => (int) config('support-requests.max_files', 5),
            'maxFileSizeMb' => (int) config('support-requests.max_file_size_mb', 50),
            'notifyEmail' => config('support-requests.notify_email'),
        ];

        if ($request->expectsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('SupportRequests/Create', $payload);
    }

    public function store(StoreSupportRequestRequest $request)
    {
        $validated = $request->validated();

        $supportRequest = DB::transaction(function () use ($validated, $request) {
            $supportRequest = SupportRequest::create([
                'name' => $validated['name'],
                'company' => $validated['company'] ?? null,
                'email' => $validated['email'],
                'phone_whatsapp' => $validated['phone_whatsapp'],
                'category' => $validated['category'],
                'other_category' => $validated['other_category'] ?? null,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'specs' => $this->sanitizeSpecs($validated['specs'] ?? []),
                'desired_date' => $validated['desired_date'] ?? null,
                'flexibility' => $validated['flexibility'] ?? null,
                'budget_min' => $validated['budget_min'] ?? null,
                'budget_max' => $validated['budget_max'] ?? null,
                'metadata' => [
                    'consent' => (bool) Arr::get($validated, 'consent'),
                    'submitted_ip' => $request->ip(),
                    'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
                ],
            ]);

            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $path = $file->store("support_requests/{$supportRequest->id}", 'public');

                    $supportRequest->files()->create([
                        'disk' => 'public',
                        'path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getClientMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }
            }

            if (!empty($supportRequest->description)) {
                $supportRequest->messages()->create([
                    'sender_type' => 'customer',
                    'body' => $supportRequest->description,
                ]);
            }

            $supportRequest->last_customer_reply_at = now();
            $supportRequest->save();

            return $supportRequest->load('files');
        });

        $this->notifyParties($supportRequest);

        return redirect()
            ->route('requests.thankyou', ['token' => $supportRequest->tracking_token])
            ->with('supportRequestReference', $supportRequest->reference);
    }

    public function thankYou(string $token)
    {
        $supportRequest = SupportRequest::trackingToken($token)
            ->with('files')
            ->firstOrFail();

        return Inertia::render('SupportRequests/ThankYou', [
            'request' => new SupportRequestResource($supportRequest),
            'trackingUrl' => route('requests.track', $token),
        ]);
    }

    public function track(string $token)
    {
        $supportRequest = SupportRequest::trackingToken($token)
            ->with(['files', 'messages.sender'])
            ->firstOrFail();

        return Inertia::render('SupportRequests/Track', [
            'request' => new SupportRequestResource($supportRequest),
        ]);
    }

    public function downloadFile(string $token, SupportRequestFile $file)
    {
        $supportRequest = SupportRequest::trackingToken($token)->firstOrFail();

        abort_unless($file->support_request_id === $supportRequest->id, 404);

        return Storage::disk($file->disk)->download($file->path, $file->original_name);
    }

    protected function sanitizeSpecs(array $specs): array
    {
        return collect($specs)
            ->map(function ($value) {
                if (is_array($value)) {
                    return array_filter($value, fn($item) => $item !== null && $item !== '');
                }

                return $value;
            })
            ->filter(fn($value) => $value !== null && $value !== '' && $value !== [])
            ->toArray();
    }

    protected function notifyParties(SupportRequest $supportRequest): void
    {
        $notifyEmail = config('support-requests.notify_email');

        try {
            if ($notifyEmail) {
                Mail::to($notifyEmail)->send(new SupportRequestAdminAlert($supportRequest));
            }
        } catch (\Throwable $exception) {
            Log::error('Failed to send support request admin alert', [
                'support_request_id' => $supportRequest->id,
                'error' => $exception->getMessage(),
            ]);
        }

        try {
            Mail::to($supportRequest->email)->send(new SupportRequestSubmitted($supportRequest));
        } catch (\Throwable $exception) {
            Log::error('Failed to send support request confirmation', [
                'support_request_id' => $supportRequest->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
