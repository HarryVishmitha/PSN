@php
$fullName = trim(($order->contact_first_name ?? '') . ' ' . ($order->contact_last_name ?? ''));
$grandTotal = $order->grand_total ?? $order->total_amount ?? null;
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Notification</title>
</head>

<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <img src="{{ asset('images/printairlogo.png') }}" alt="Printair Logo" style="max-width: 150px; height: auto;">
            </div>
            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: bold; text-align: center;">New Order Received 📦</h1>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; text-align: center;">Order <strong>#{{ $order->id }}</strong></p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">

            <!-- Customer Info Section -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #111827; text-align: center;">Customer Information</h2>

                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px;">Customer Name</div>
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">{{ $fullName !== '' ? $fullName : 'Guest' }}</div>
                </div>

                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px;">Email</div>
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">{{ $order->contact_email ?? 'N/A' }}</div>
                </div>

                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px;">Phone</div>
                    <div style="font-size: 16px; color: #111827; font-weight: 500;">{{ $order->contact_phone ?? 'N/A' }}</div>
                </div>

                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px;">Grand Total</div>
                    <div style="font-size: 18px; color: #0ea5e9; font-weight: 700;">{{ $grandTotal !== null ? 'LKR ' . number_format($grandTotal, 2) : 'N/A' }}</div>
                </div>
            </div>

            <!-- Customer Notes -->
            @if(!empty($order->notes))
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #92400e;">Customer Notes</h3>
                <p style="margin: 0; color: #78350f; line-height: 1.6; font-size: 14px;">{{ $order->notes }}</p>
            </div>
            @endif

            <!-- Items Table -->
            @if($order->items && $order->items->count())
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold; color: #111827;">Order Items</h2>
                <table role="presentation" width="100%" style="border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.03); border-collapse: separate; border-spacing: 0;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); color: #ffffff;">
                            <th align="left" style="padding: 14px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Item</th>
                            <th align="center" style="padding: 14px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Qty</th>
                            <th align="right" style="padding: 14px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Unit</th>
                            <th align="right" style="padding: 14px 16px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($order->items as $item)
                        <tr>
                            <td style="padding: 14px 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff; font-size: 14px; color: #111827;">{{ $item->name }}</td>
                            <td align="center" style="padding: 14px 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff; font-size: 14px; color: #111827;">{{ $item->quantity }}</td>
                            <td align="right" style="padding: 14px 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff; font-size: 14px; color: #111827;">LKR {{ number_format($item->unit_price, 2) }}</td>
                            <td align="right" style="padding: 14px 16px; border-top: 1px solid #e5e7eb; background-color: #ffffff; font-size: 14px; color: #111827; font-weight: 600;">LKR {{ number_format($item->subtotal, 2) }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @endif

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ url('/admin/orders/' . $order->id) }}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3);">Open Order</a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-align: center;">Order notification from</p>
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600; text-align: center;">{{ config('app.name') }} Admin System</p>
        </div>
    </div>
</body>

</html>