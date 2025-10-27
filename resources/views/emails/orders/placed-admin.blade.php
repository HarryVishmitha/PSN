@php
    $fullName = trim(($order->contact_first_name ?? '') . ' ' . ($order->contact_last_name ?? ''));
    $grandTotal = $order->grand_total ?? $order->total_amount ?? null;
@endphp
@component('mail::message')
# New order #{{ $order->id }} received

**Customer:** {{ $fullName !== '' ? $fullName : 'Guest' }}  
**Email:** {{ $order->contact_email ?? 'N/A' }}  
**Phone:** {{ $order->contact_phone ?? 'N/A' }}  
**Grand total:** {{ $grandTotal !== null ? number_format($grandTotal, 2) : 'N/A' }}

@if(!empty($order->notes))
@component('mail::panel')
**Customer notes:**  
{{ $order->notes }}
@endcomponent
@endif

@if($order->items && $order->items->count())
@component('mail::table')
| Item | Qty | Unit | Line Total |
| :---- | :---: | ----: | --------: |
@foreach($order->items as $item)
| {{ $item->name }} | {{ $item->quantity }} | {{ number_format($item->unit_price, 2) }} | {{ number_format($item->subtotal, 2) }} |
@endforeach
@endcomponent
@endif

@component('mail::button', ['url' => url('/admin/orders/' . $order->id)])
Open Order
@endcomponent

Thanks,  
{{ config('app.name') }}
@endcomponent

