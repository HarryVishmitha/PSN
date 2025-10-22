<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminSupportRequestMessageRequest;
use App\Http\Resources\SupportRequestResource;
use App\Mail\SupportRequestUpdated;
use App\Models\SupportRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class SupportRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'category', 'search']);

        $query = SupportRequest::query()
            ->withCount('messages');

        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }

        if ($filters['category'] ?? null) {
            $query->where('category', $filters['category']);
        }

        if ($filters['search'] ?? null) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('reference', 'like', "%{$term}%")
                    ->orWhere('title', 'like', "%{$term}%")
                    ->orWhere('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone_whatsapp', 'like', "%{$term}%");
            });
        }

        $requests = $query
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/SupportRequests/Index', [
            'userDetails' => $request->user(),
            'requests' => SupportRequestResource::collection($requests),
            'filters' => $filters,
            'statuses' => SupportRequest::STATUSES,
            'categories' => collect(config('support-requests.categories'))
                ->map(fn($data, $key) => [
                    'value' => $key,
                    'label' => $data['label'] ?? ucfirst(str_replace('-', ' ', $key)),
                ])
                ->values(),
        ]);
    }

    public function show(SupportRequest $supportRequest): Response
    {
        $supportRequest->load(['files', 'messages.sender']);

        return Inertia::render('admin/SupportRequests/Show', [
            'userDetails' => request()->user(),
            'request' => new SupportRequestResource($supportRequest),
            'statuses' => SupportRequest::STATUSES,
        ]);
    }

    public function reply(
        AdminSupportRequestMessageRequest $request,
        SupportRequest $supportRequest
    ) {
        $data = $request->validated();
        $admin = $request->user();

        $message = DB::transaction(function () use ($supportRequest, $data, $admin) {
            $updates = [
                'last_admin_reply_at' => now(),
            ];

            if (!empty($data['status']) && $supportRequest->status !== $data['status']) {
                $updates['status'] = $data['status'];

                if ($data['status'] === 'approved' && $supportRequest->approved_at === null) {
                    $updates['approved_at'] = now();
                }
            }

            $message = $supportRequest->messages()->create([
                'sender_type' => 'admin',
                'sender_id' => $admin?->id,
                'body' => $data['message'],
            ]);

            $supportRequest->forceFill($updates)->save();

            if (isset($updates['status'])) {
                SupportRequest::whereKey($supportRequest->id)->update(['status' => $updates['status']]);
                $supportRequest->status = $updates['status'];
            }

            return $message;
        });

        if ($request->boolean('notify_customer', true)) {
            try {
                $supportRequest = $supportRequest->fresh(['files', 'messages.sender']);

                Mail::to($supportRequest->email)->send(
                    new SupportRequestUpdated($supportRequest, $message)
                );

                $message->update(['notified_at' => now()]);
            } catch (\Throwable $exception) {
                Log::error('Failed to send support request update email', [
                    'support_request_id' => $supportRequest->id,
                    'message_id' => $message->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return redirect()
            ->back()
            ->with('flash', ['type' => 'success', 'message' => 'Reply sent to customer.']);
    }
}
