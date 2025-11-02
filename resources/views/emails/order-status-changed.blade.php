{{-- Variables passed from OrderStatusChanged Mailable: $order, $oldStatus, $newStatus --}}
@php
    if (empty($trackingUrl) && !empty($order->tracking_token)) {
        $trackingUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'order-tracking.orders.show',
            now()->addDays(7),
            [
                'order' => $order->id,
                'token' => $order->tracking_token,
            ]
        );
    }
@endphp

<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">

<head>
    <meta charset="UTF-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>Order Status Update - {{ $order->number ?? sprintf('ORD-%05d', $order->id) }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Reset-ish */
        html,
        body {
            margin: 0 !important;
            padding: 0 !important;
            background: #f6f7fb;
            font-family: 'Be Vietnam Pro', sans-serif;
        }

        img {
            border: 0;
            outline: none;
            text-decoration: none;
            display: block;
            max-width: 100%;
            line-height: 100%;
        }

        table {
            border-collapse: collapse !important;
            border-spacing: 0 !important;
        }

        .btn {
            background: #f44032;
            color: #ffffff;
            text-decoration: none;
            display: inline-block;
            padding: 12px 18px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .btn:hover {
            background: #e53935;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }

        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }

        .status-confirmed,
        .status-customer_approved {
            background: #d1fae5;
            color: #065f46;
        }

        .status-in_production {
            background: #ddd6fe;
            color: #5b21b6;
        }

        .status-ready_for_delivery {
            background: #ccfbf1;
            color: #115e59;
        }

        .status-awaiting_customer_approval {
            background: #e0f2fe;
            color: #075985;
        }

        .status-completed {
            background: #d1fae5;
            color: #065f46;
        }

        .status-on_hold {
            background: #fed7aa;
            color: #9a3412;
        }

        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }

        .muted {
            color: #6b7280;
            font-size: 12px
        }

        .highlight {
            color: #f44032;
        }

        @media (max-width:600px) {
            .container {
                width: 100% !important
            }

            .px {
                padding-left: 16px !important;
                padding-right: 16px !important
            }
        }
    </style>
</head>

<body style="margin:0;padding:0;background:#f6f7fb;font-family:'Be Vietnam Pro',sans-serif;">
    <!-- PREVIEW TEXT (hidden) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Your order {{ $order->number ?? sprintf('ORD-%05d', $order->id) }} status has been updated to {{ $newStatus }}.
    </div>

    <table role="presentation" width="100%" bgcolor="#f6f7fb">
        <tr>
            <td align="center" style="padding:24px;">
                <table class="container" role="presentation" width="640" style="width:640px;max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;">
                    <!-- Header -->
                    <tr>
                        <td class="px" style="padding:20px 28px;background:#f44032;">
                            <table width="100%">
                                <tr>
                                    <td align="left">
                                        <img src="{{ asset('assets/images/logo-light.png') }}" width="160" alt="Printair Advertising" />
                                    </td>
                                    <td align="right" style="text-align:right;color:#fff;">
                                        <div style="font-size:12px;opacity:0.8;">Order</div>
                                        <div style="font-size:16px;font-weight:700;">{{ $order->number ?? sprintf('ORD-%05d', $order->id) }}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Hero -->
                    <tr>
                        <td class="px" style="padding:32px 28px 20px;">
                            <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#111827;font-weight:700;">
                                Order Status Update <span style="color:#f44032;">📦</span>
                            </h1>
                            <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
                                Hi {{ $order->contact_first_name ?? 'there' }},<br />
                                Great news! Your order status has been updated. Here are the latest details about your order with Printair.
                            </p>
                        </td>
                    </tr>

                    <!-- Status Change Card -->
                    <tr>
                        <td class="px" style="padding:0 28px 24px;">
                            <table role="presentation" width="100%" style="background:linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                                <tr>
                                    <td style="padding:24px;">
                                        <table role="presentation" width="100%">
                                            <tr>
                                                <td width="45%" style="padding-right:10px;">
                                                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Previous Status</div>
                                                    <span class="status-badge status-{{ str_replace(' ', '_', strtolower($oldStatus)) }}">
                                                        {{ ucwords(str_replace('_', ' ', $oldStatus)) }}
                                                    </span>
                                                </td>
                                                <td width="10%" align="center" style="color:#d1d5db;font-size:24px;">
                                                    →
                                                </td>
                                                <td width="45%" style="padding-left:10px;">
                                                    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Current Status</div>
                                                    <span class="status-badge status-{{ str_replace(' ', '_', strtolower($newStatus)) }}">
                                                        {{ ucwords(str_replace('_', ' ', $newStatus)) }}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Order Summary -->
                    <tr>
                        <td class="px" style="padding:0 28px 24px;">
                            <table role="presentation" width="100%" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                                <tr>
                                    <td style="padding:20px;">
                                        <div style="font-size:14px;color:#6b7280;margin-bottom:12px;font-weight:600;">Order Summary</div>
                                        <table role="presentation" width="100%">
                                            <tr>
                                                <td width="50%" style="padding:8px 0;">
                                                    <div style="font-size:12px;color:#6b7280;margin-bottom:3px;">Order Date</div>
                                                    <div style="font-weight:600;color:#111827;font-size:14px;">
                                                        {{ $order->created_at->format('d M Y') }}
                                                    </div>
                                                </td>
                                                <td width="50%" style="padding:8px 0;">
                                                    <div style="font-size:12px;color:#6b7280;margin-bottom:3px;">Total Amount</div>
                                                    <div style="font-weight:700;color:#f44032;font-size:16px;">
                                                        LKR {{ number_format($order->total_amount, 2) }}
                                                    </div>
                                                </td>
                                            </tr>
                                            @if($order->items->count() > 0)
                                            <tr>
                                                <td colspan="2" style="padding:8px 0;border-top:1px solid #e5e7eb;">
                                                    <div style="font-size:12px;color:#6b7280;margin-bottom:3px;">Items</div>
                                                    <div style="font-weight:600;color:#111827;font-size:14px;">
                                                        {{ $order->items->count() }} item(s)
                                                    </div>
                                                </td>
                                            </tr>
                                            @endif
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    @if($order->notes)
                    <!-- Notes -->
                    <tr>
                        <td class="px" style="padding:0 28px 24px;">
                            <table role="presentation" width="100%" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;">
                                <tr>
                                    <td>
                                        <div style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:6px;">📝 Order Notes</div>
                                        <div style="font-size:14px;color:#78350f;line-height:1.6;">
                                            {{ $order->notes }}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    @endif

                    <!-- CTA -->
                    <tr>
                        <td class="px" style="padding:0 28px 32px;">
                            <table role="presentation" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                                <tr>
                                    <td align="left" style="padding-bottom:16px;">
                                        <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
                                            We're committed to delivering your order with excellence. If you have any questions, please don't hesitate to reach out.
                                        </p>
                                        @if(!empty($trackingUrl))
                                        <a href="{{ $trackingUrl }}" class="btn">Track Your Order</a>
                                        <p style="margin:12px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
                                            Or copy this tracking link:<br>
                                            <a href="{{ $trackingUrl }}" style="color:#f44032;text-decoration:none;word-break:break-all;">
                                                {{ $trackingUrl }}
                                            </a>
                                        </p>
                                        @else
                                        <span style="display:inline-block;padding:12px 18px;border-radius:8px;background:#94a3b8;color:#ffffff;font-weight:600;">
                                            Tracking link unavailable
                                        </span>
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border-top:1px solid #e5e7eb;padding-top:16px;">
                                        <p class="muted" style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                                            Need help? Email us at <span style="color:#f44032;font-weight:500;">{{ config('mail.from.address') }}</span> or call <span style="color:#f44032;font-weight:500;">{{ config('app.phone', '+94 77 123 4567') }}</span>.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px;text-align:center;background:linear-gradient(135deg, #111827 0%, #1f2937 100%);color:#9ca3af;font-size:13px;border-bottom-left-radius:14px;border-bottom-right-radius:14px;">
                            <img src="{{ asset('images/printairlogo.png') }}" width="120" alt="Printair Advertising" style="margin:0 auto 10px;" />
                            <div style="margin-bottom:5px;color:#d1d5db;">printair.lk • Walpola, Ragama • Sri Lanka</div>
                            <div style="color:#9ca3af;">© {{ now()->year }} Printair Advertising — All rights reserved</div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>

</html>
