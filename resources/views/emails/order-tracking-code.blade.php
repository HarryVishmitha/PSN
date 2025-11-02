{{-- Variables passed: $order, $code, $expiresAt --}}

<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">

<head>
    <meta charset="UTF-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>Order Tracking Code - {{ $order->number ?? sprintf('ORD-%05d', $order->id) }}</title>
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

        .code-box {
            background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
            border: 2px solid #f44032;
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(244, 64, 50, 0.15);
        }

        .code {
            font-size: 42px;
            letter-spacing: 12px;
            font-weight: 800;
            color: #f44032;
            display: inline-block;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            font-family: 'Courier New', monospace;
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

            .code {
                font-size: 32px !important;
                letter-spacing: 8px !important;
            }
        }
    </style>
</head>

<body style="margin:0;padding:0;background:#f6f7fb;font-family:'Be Vietnam Pro',sans-serif;">
    <!-- PREVIEW TEXT (hidden) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Your verification code for order {{ $order->number ?? sprintf('ORD-%05d', $order->id) }} is {{ $code }}.
    </div>

    <table role="presentation" width="100%" bgcolor="#f6f7fb">
        <tr>
            <td align="center" style="padding:24px;">
                <table class="container" role="presentation" width="640" style="width:640px;max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;">
                    <!-- Header -->
                    <tr>
                        <td class="px" style="padding:20px 28px;background:linear-gradient(135deg, #f44032 0%, #ff6b5e 100%);">
                            <table width="100%">
                                <tr>
                                    <td align="left">
                                        <img src="{{ asset('images/printairlogo.png') }}" width="160" alt="Printair Advertising" />
                                    </td>
                                    <td align="right" style="text-align:right;color:#fff;">
                                        <div style="font-size:12px;opacity:0.9;">Order</div>
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
                                Track Your Order <span style="color:#f44032;">🔐</span>
                            </h1>
                            <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
                                Hi there,<br />
                                We received a request to view the status of your order. Use the verification code below to continue securely accessing your order details.
                            </p>
                        </td>
                    </tr>

                    <!-- Verification Code Box -->
                    <tr>
                        <td class="px" style="padding:0 28px 24px;">
                            <div class="code-box" style="background:linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);border:2px solid #f44032;border-radius:16px;padding:32px;text-align:center;box-shadow:0 4px 16px rgba(244, 64, 50, 0.15);">
                                <div style="font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-weight:600;">Your Verification Code</div>
                                <div class="code" style="font-size:42px;letter-spacing:12px;font-weight:800;color:#f44032;display:inline-block;text-shadow:2px 2px 4px rgba(0, 0, 0, 0.1);font-family:'Courier New',monospace;">
                                    {{ $code }}
                                </div>
                                <div style="margin-top:16px;font-size:13px;color:#78350f;line-height:1.6;">
                                    Enter this code on the tracking page to view your order
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Security Info -->
                    <tr>
                        <td class="px" style="padding:0 28px 24px;">
                            <table role="presentation" width="100%" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                                <tr>
                                    <td style="padding:20px;">
                                        <div style="font-size:13px;color:#92400e;font-weight:600;margin-bottom:8px;">⏰ Code Expiration</div>
                                        <div style="font-size:14px;color:#78350f;line-height:1.6;margin-bottom:12px;">
                                            For your security, this code expires at:
                                        </div>
                                        <div style="font-size:16px;color:#92400e;font-weight:700;">
                                            {{ $expiresAt->timezone(config('app.timezone'))->format('M j, Y g:i A T') }}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                        <td class="px" style="padding:0 28px 24px;">
                            <table role="presentation" width="100%" style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                                <tr>
                                    <td style="padding:20px;">
                                        <div style="font-size:13px;color:#166534;font-weight:600;margin-bottom:8px;">🛡️ Security Notice</div>
                                        <div style="font-size:14px;color:#15803d;line-height:1.6;">
                                            If you did not request this code, you can safely ignore this email. Your order details remain secure and no action is required.
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td class="px" style="padding:0 28px 32px;">
                            <table role="presentation" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                                <tr>
                                    <td align="left" style="padding-bottom:16px;">
                                        <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
                                            Need to track your order? Click the button below to continue.
                                        </p>
                                        <a href="{{ route('order-tracking.show') }}" class="btn" style="background:#f44032;color:#ffffff;text-decoration:none;display:inline-block;padding:12px 18px;border-radius:8px;font-weight:600;">Track Order Now</a>
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
