<?php

namespace App\Http\Controllers;

use App\Mail\OrderTrackingCode;
use App\Models\DailyCustomer;
use App\Models\Order;
use App\Models\OrderAttachment;
use App\Models\OrderEvent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\RelationNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderTrackingController extends Controller
{
    private const OTP_LENGTH = 6;
    private const OTP_TTL_MINUTES = 15;
    private const OTP_MAX_ATTEMPTS = 5;
    private const REQUEST_RATE_LIMIT = 5;
    private const REQUEST_DECAY_SECONDS = 600; // 10 minutes
    private const VERIFY_RATE_LIMIT = 10;
    private const VERIFY_DECAY_SECONDS = 600;
    private const SIGNED_URL_TTL_MINUTES = 30;

    public function index(Request $request): Response
    {
        return Inertia::render('guest/orders/TrackOrder', [
            'prefill' => [
                'order' => $request->query('order'),
                'email' => $request->query('email'),
            ],
        ]);
    }

    public function requestCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_reference' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
        ]);

        $normalizedEmail = Str::lower(trim($validated['email']));
        $throttleKey = $this->requestThrottleKey($request, $normalizedEmail);

        if (RateLimiter::tooManyAttempts($throttleKey, self::REQUEST_RATE_LIMIT)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'message' => 'Too many attempts. Please try again in ' . ceil($seconds / 60) . ' minute(s).',
            ], 429);
        }

        $order = $this->findOrderByReference($validated['order_reference']);

        if (!$order) {
            RateLimiter::hit($throttleKey, self::REQUEST_DECAY_SECONDS);
            throw ValidationException::withMessages([
                'order_reference' => 'We could not find an order with that reference.',
            ]);
        }

        $this->loadOrderRelations($order);

        if (!$this->emailMatchesOrder($order, $normalizedEmail)) {
            RateLimiter::hit($throttleKey, self::REQUEST_DECAY_SECONDS);
            throw ValidationException::withMessages([
                'email' => 'The email address does not match our records for this order.',
            ]);
        }

        $code = $this->generateOtp();
        $expiresAt = now()->addMinutes(self::OTP_TTL_MINUTES);

        $cacheKey = $this->otpCacheKey($order->id, $normalizedEmail);

        Cache::put($cacheKey, [
            'code_hash' => $this->hashOtp($code),
            'order_id' => $order->id,
            'email' => $normalizedEmail,
            'attempts' => 0,
            'expires_at' => $expiresAt,
        ], $expiresAt);

        Mail::to($normalizedEmail)->queue(new OrderTrackingCode($order, $code, $expiresAt->copy()));

        RateLimiter::hit($throttleKey, self::REQUEST_DECAY_SECONDS);

        return response()->json([
            'message' => 'We have emailed a verification code to you. Please check your inbox.',
        ]);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_reference' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
            'code' => ['required', 'string', 'size:' . self::OTP_LENGTH, 'regex:/^\d+$/'],
        ]);

        $normalizedEmail = Str::lower(trim($validated['email']));
        $throttleKey = $this->verifyThrottleKey($request, $validated['order_reference'], $normalizedEmail);

        if (RateLimiter::tooManyAttempts($throttleKey, self::VERIFY_RATE_LIMIT)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'message' => 'Too many verification attempts. Please try again in ' . ceil($seconds / 60) . ' minute(s).',
            ], 429);
        }

        $order = $this->findOrderByReference($validated['order_reference']);

        if (!$order) {
            RateLimiter::hit($throttleKey, self::VERIFY_DECAY_SECONDS);
            throw ValidationException::withMessages([
                'order_reference' => 'We could not find an order with that reference.',
            ]);
        }

        $this->loadOrderRelations($order);

        if (!$this->emailMatchesOrder($order, $normalizedEmail)) {
            RateLimiter::hit($throttleKey, self::VERIFY_DECAY_SECONDS);
            throw ValidationException::withMessages([
                'email' => 'The email address does not match our records for this order.',
            ]);
        }

        $cacheKey = $this->otpCacheKey($order->id, $normalizedEmail);
        $payload = Cache::get($cacheKey);

        if (!$payload || !isset($payload['code_hash'], $payload['expires_at'])) {
            RateLimiter::hit($throttleKey, self::VERIFY_DECAY_SECONDS);
            throw ValidationException::withMessages([
                'code' => 'The verification code has expired. Please request a new one.',
            ]);
        }

        $expiresAt = $this->asCarbon($payload['expires_at']);

        if (now()->greaterThan($expiresAt)) {
            Cache::forget($cacheKey);
            RateLimiter::hit($throttleKey, self::VERIFY_DECAY_SECONDS);
            throw ValidationException::withMessages([
                'code' => 'The verification code has expired. Please request a new one.',
            ]);
        }

        $attempts = (int) ($payload['attempts'] ?? 0);

        if ($attempts >= self::OTP_MAX_ATTEMPTS) {
            Cache::forget($cacheKey);
            RateLimiter::hit($throttleKey, self::VERIFY_DECAY_SECONDS);
            throw ValidationException::withMessages([
                'code' => 'You have exceeded the maximum attempts. Please request a new code.',
            ]);
        }

        if (!hash_equals($payload['code_hash'], $this->hashOtp($validated['code']))) {
            $payload['attempts'] = $attempts + 1;
            Cache::put($cacheKey, $payload, $expiresAt);
            RateLimiter::hit($throttleKey, self::VERIFY_DECAY_SECONDS);

            throw ValidationException::withMessages([
                'code' => 'The verification code is incorrect.',
            ]);
        }

        Cache::forget($cacheKey);
        RateLimiter::clear($throttleKey);

        $token = $order->ensureTrackingToken(true);
        $signedUrl = URL::temporarySignedRoute(
            'order-tracking.orders.show',
            now()->addMinutes(self::SIGNED_URL_TTL_MINUTES),
            [
                'order' => $order->id,
                'token' => $token,
            ]
        );

        return response()->json([
            'redirect' => $signedUrl,
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $token = (string) $request->query('token', '');

        if (!$request->hasValidSignature() || !hash_equals((string) $order->tracking_token, $token)) {
            abort(403, 'This tracking link is invalid or has expired.');
        }

        $order->load([
            'items.product:id,name,unit_of_measure,pricing_method',
            'items.variant:id,variant_name,variant_value',
            'items.subvariant:id,subvariant_name,subvariant_value',
            'attachments' => function ($query) {
                $query->where('file_type', 'estimate_pdf');
            },
            'estimate:id,estimate_number,status,total_amount',
        ]);

        $statusConfig = $order->getStatusConfig();

        $timeline = $order->events()
            ->whereIn('visibility', [OrderEvent::VISIBILITY_CUSTOMER, OrderEvent::VISIBILITY_PUBLIC])
            ->latest('created_at')
            ->get()
            ->map(fn (OrderEvent $event) => [
                'id'         => $event->id,
                'event_type' => $event->event_type,
                'title'      => $event->title,
                'message'    => $event->message,
                'old_status' => $event->old_status,
                'new_status' => $event->new_status,
                'created_at' => optional($event->created_at)->toIso8601String(),
            ]);

        $attachments = $order->attachments->map(function (OrderAttachment $attachment) use ($order, $token) {
            $downloadUrl = URL::temporarySignedRoute(
                'order-tracking.orders.attachments.download',
                now()->addMinutes(10),
                [
                    'order' => $order->id,
                    'attachment' => $attachment->id,
                    'token' => $token,
                ]
            );

            return [
                'id'        => $attachment->id,
                'file_name' => $attachment->file_name,
                'url'       => $downloadUrl,
                'uploaded_at' => optional($attachment->created_at)->toIso8601String(),
            ];
        });

        $hasEstimateAttachment = $attachments->isNotEmpty();
        $canApprove = $hasEstimateAttachment && in_array($order->status, ['estimate_sent', 'awaiting_customer_approval'], true);

        $approveUrl = $canApprove
            ? URL::temporarySignedRoute(
                'order-tracking.orders.approve',
                now()->addMinutes(10),
                [
                    'order' => $order->id,
                    'token' => $token,
                ]
            )
            : null;

        $contactName = trim(collect([
            $order->contact_first_name,
            $order->contact_last_name,
        ])->filter()->implode(' '));

        $expiresAt = $request->query('expires')
            ? Carbon::createFromTimestamp((int) $request->query('expires'))->toIso8601String()
            : null;

        return Inertia::render('guest/orders/Show', [
            'order' => [
                'id'                 => $order->id,
                'number'             => $order->number,
                'status'             => $order->status,
                'status_label'       => $statusConfig['label'] ?? ucfirst(str_replace('_', ' ', $order->status)),
                'status_color'       => $statusConfig['color'] ?? 'gray',
                'status_description' => $statusConfig['description'] ?? null,
                'subtotal_amount'    => (float) $order->subtotal_amount,
                'discount_amount'    => (float) $order->discount_amount,
                'tax_amount'         => (float) $order->tax_amount,
                'shipping_amount'    => (float) $order->shipping_amount,
                'total_amount'       => (float) $order->total_amount,
                'created_at'         => optional($order->created_at)->toIso8601String(),
                'placed_at'          => optional($order->placed_at)->toIso8601String(),
                'contact_name'       => $contactName ?: null,
                'contact_email'      => $order->contact_email,
                'attachments'        => $attachments,
                'items'              => $order->items->map(function ($item) {
                    return [
                        'id'          => $item->id,
                        'name'        => $item->name ?? $item->product?->name,
                        'description' => $item->description,
                        'quantity'    => (float) $item->quantity,
                        'unit'        => $item->unit ?? $item->product?->unit_of_measure,
                        'unit_price'  => (float) $item->unit_price,
                        'line_total'  => (float) $item->line_total,
                    ];
                }),
                'can_approve'        => $canApprove,
                'approve_url'        => $approveUrl,
            ],
            'timeline'  => $timeline,
            'expiresAt' => $expiresAt,
        ]);
    }

    public function approve(Request $request, Order $order): JsonResponse
    {
        $token = (string) $request->query('token', $request->input('token', ''));

        if (!$request->hasValidSignature() || !hash_equals((string) $order->tracking_token, $token)) {
            abort(403, 'This approval link is invalid or has expired.');
        }

        if (!in_array($order->status, ['estimate_sent', 'awaiting_customer_approval'], true)) {
            return response()->json([
                'message' => 'This order cannot be approved in its current status.',
            ], 422);
        }

        $hasEstimatePdf = $order->attachments()
            ->where('file_type', 'estimate_pdf')
            ->exists();

        if (!$hasEstimatePdf) {
            return response()->json([
                'message' => 'Approval is unavailable until the quotation is attached.',
            ], 422);
        }

        if (!$order->canTransitionTo('customer_approved')) {
            return response()->json([
                'message' => 'Order cannot transition to Customer Approved from current status.',
            ], 422);
        }

        $note = trim((string) $request->input('note', '')) ?: 'Customer confirmed the estimate via secure tracking link.';

        DB::transaction(function () use ($order, $note) {
            $oldStatus = $order->status;

            $order->forceFill([
                'status'     => 'customer_approved',
                'updated_by' => null,
            ])->save();

            $order->recordStatusChange('customer_approved', [
                'old_status' => $oldStatus,
                'message'    => $note,
                'visibility' => OrderEvent::VISIBILITY_CUSTOMER,
                'created_by' => null,
            ]);
        });

        return response()->json([
            'message' => 'Thank you! We have recorded your approval.',
        ]);
    }

    public function downloadAttachment(Request $request, Order $order, OrderAttachment $attachment)
    {
        $token = (string) $request->query('token', '');

        if (!$request->hasValidSignature() || !hash_equals((string) $order->tracking_token, $token)) {
            abort(403, 'This download link is invalid or has expired.');
        }

        if ($attachment->order_id !== $order->id || $attachment->file_type !== 'estimate_pdf') {
            abort(404);
        }

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);
    }

    private function requestThrottleKey(Request $request, string $email): string
    {
        return implode('|', ['order-tracking:request', $email, $request->ip()]);
    }

    private function verifyThrottleKey(Request $request, string $reference, string $email): string
    {
        return implode('|', ['order-tracking:verify', Str::lower(trim($reference)), $email, $request->ip()]);
    }

    private function otpCacheKey(int $orderId, string $email): string
    {
        return "order-tracking:otp:{$orderId}:" . hash('sha256', $email);
    }

    private function generateOtp(): string
    {
        return str_pad((string) random_int(0, (10 ** self::OTP_LENGTH) - 1), self::OTP_LENGTH, '0', STR_PAD_LEFT);
    }

    private function hashOtp(string $code): string
    {
        return hash_hmac('sha256', $code, config('app.key'));
    }

    private function findOrderByReference(string $reference): ?Order
    {
        $reference = trim($reference);

        if ($reference === '') {
            return null;
        }

        if (preg_match('/^\d+$/', $reference) === 1) {
            return Order::query()->where('id', (int) $reference)->first();
        }

        if (preg_match('/^ORD-?(\d+)$/i', $reference, $matches) === 1) {
            $id = (int) ltrim($matches[1], '0');

            return Order::query()
                ->where('number', $reference)
                ->orWhere('number', Str::upper($reference))
                ->orWhere('id', $id)
                ->first();
        }

        return Order::query()
            ->where('number', $reference)
            ->orWhere('number', Str::upper($reference))
            ->first();
    }

    private function asCarbon($value): Carbon
    {
        if ($value instanceof Carbon) {
            return $value->copy();
        }

        return Carbon::make($value) ?? now();
    }

    private function emailMatchesOrder(Order $order, string $email): bool
    {
        return $this->collectOrderEmails($order)->contains($email);
    }

    private function loadOrderRelations(Order $order): void
    {
        $relations = [];

        foreach (['customer'] as $relation) {
            if (method_exists($order, $relation)) {
                $relations[] = $relation;
            }
        }

        if (!empty($relations)) {
            try {
                $order->loadMissing($relations);
            } catch (RelationNotFoundException $exception) {
                // Some deployments may not define optional relations; ignore gracefully.
            }
        }
    }

    private function collectOrderEmails(Order $order): \Illuminate\Support\Collection
    {
        $this->loadOrderRelations($order);

        $emails = collect([$order->contact_email]);

        if ($order->user_id) {
            $userEmail = $this->resolveUserEmail($order);
            if ($userEmail) {
                $emails->push($userEmail);
            }
        }

        $customerEmails = $this->resolveCustomerEmails($order);
        if ($customerEmails->isNotEmpty()) {
            $emails = $emails->merge($customerEmails);
        }

        return $emails
            ->filter()
            ->map(fn ($value) => Str::lower(trim($value)))
            ->unique();
    }

    private function resolveUserEmail(Order $order): ?string
    {
        try {
            if (method_exists($order, 'user') && $order->relationLoaded('user')) {
                return optional($order->getRelation('user'))->email;
            }
        } catch (RelationNotFoundException $exception) {
            // fall through to manual lookup
        }

        return optional(User::find($order->user_id))->email;
    }

    private function resolveCustomerEmails(Order $order): \Illuminate\Support\Collection
    {
        $emails = collect();
        $customer = null;

        try {
            if (method_exists($order, 'customer') && $order->relationLoaded('customer')) {
                $customer = $order->getRelation('customer');
            }
        } catch (RelationNotFoundException $exception) {
            $customer = null;
        }

        if (!$customer && $order->customer_type && $order->customer_id) {
            if ($order->customer_type === DailyCustomer::class) {
                $customer = DailyCustomer::find($order->customer_id);
            } elseif ($order->customer_type === User::class) {
                $customer = User::find($order->customer_id);
            }
        }

        if ($customer) {
            $emails->push(
                data_get($customer, 'email'),
                data_get($customer, 'contact_email'),
                data_get($customer, 'primary_email')
            );
        }

        return $emails->filter();
    }
}
