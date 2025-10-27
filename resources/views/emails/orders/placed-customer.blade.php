@php
    $grandTotal = $order->grand_total ?? $order->total_amount ?? null;
@endphp
@component('mail::message')
# Thank you for your order

Hi {{ $order->contact_first_name ?? 'there' }},

We received your order #{{ $order->id }}. Our team will review the details and share payment information soon.

**Order summary**

- Grand total: {{ $grandTotal !== null ? number_format($grandTotal, 2) : 'We will confirm the total shortly.' }}
- Contact phone: {{ $order->contact_phone ?? 'N/A' }}
- Shipping to: {{ optional($order->shippingAddress)->line1 ?? 'Pending confirmation' }}

@if($order->items && $order->items->count())
@component('mail::table')
| Item | Qty | Line Total |
| :---- | :---: | --------: |
@foreach($order->items as $item)
| {{ $item->name }} | {{ $item->quantity }} | {{ number_format($item->subtotal, 2) }} |
@endforeach
@endcomponent
@endif

If anything needs to be corrected, reply to this email and we will help right away.

Thanks,  
{{ config('app.name') }}
@endcomponent

