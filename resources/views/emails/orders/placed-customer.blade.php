@php
$grandTotal = $order->grand_total ?? $order->total_amount ?? null;
$fullName = trim(($order->contact_first_name ?? '') . ' ' . ($order->contact_last_name ?? ''));
if ($fullName === '') {
$fullName = $order->contact_first_name ?? 'there';
}
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>

<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f44032 0%, #ff6b5e 100%); padding: 40px 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <img src="{{ asset('assets/images/logo-light.png') }}" alt="Printair Logo" style="max-width: 150px; height: auto;">
            </div>
            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: bold; text-align: center;">Thank You for Your Order! 🎉</h1>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; text-align: center;">Order <strong>#{{ $order->id }}</strong></p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">

            <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
                Hi {{ $fullName }},<br />
                We received your order and our team will review the details. We'll share payment information soon.
            </p>

            <!-- Summary Section -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #111827; text-align: center;">Order Summary</h2>

                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px;">Grand Total</div>
                    <div style="font-size: 18px; color: #f44032; font-weight: 700;">{{ $grandTotal !== null ? 'LKR ' . number_format($grandTotal, 2) : 'We will confirm the total shortly.' }}</div>
                </div>

                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px;">Contact Phone</div>
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">{{ $order->contact_phone ?? 'N/A' }}</div>
                </div>

                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px;">Shipping Address</div>
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">{{ optional($order->shippingAddress)->line1 ?? 'Pending confirmation' }}</div>
                </div>
            </div>

            <!-- Items Table -->
            @if($order->items && $order->items->count())
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold; color: #111827;">Order Items</h2>
                <table role="presentation" width="100%" style="border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.03); border-collapse: separate; border-spacing: 0;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); color: #ffffff;">
                            <th align="left" style="padding: 14px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Item</th>
                            <th align="center" style="padding: 14px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Qty</th>
                            <th align="right" style="padding: 14px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                        <tr>
                            <td style="padding: 14px 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff; font-size: 14px; color: #111827;">{{ $item->name }}</td>
                            <td align="center" style="padding: 14px 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff; font-size: 14px; color: #111827;">{{ $item->quantity }}</td>
                            <td align="right" style="padding: 14px 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff; font-size: 14px; color: #111827; font-weight: 600;">LKR {{ number_format($item->subtotal, 2) }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @endif

            <!-- Help Text -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                    If anything needs to be corrected, reply to this email and we will help right away.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-align: center;">Thank you for choosing</p>
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600; text-align: center;">{{ config('app.name') }}</p>
        </div>
    </div>
</body>

</html>