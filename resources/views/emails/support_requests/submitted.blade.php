<x-mail::message>
# Thanks, {{ $request->name }}!

We have logged your request **{{ $request->reference }}** and our team will reach out shortly.

<x-mail::panel>
**Summary**

- Title: {{ $request->title }}
- Category: {{ config('support-requests.categories.' . $request->category . '.label') ?? ucfirst(str_replace('-', ' ', $request->category)) }}
@if($request->desired_date)
- Desired date: {{ \Illuminate\Support\Carbon::parse($request->desired_date)->toFormattedDateString() }}
@endif
- WhatsApp: {{ $request->phone_whatsapp }}
@if($request->budget_min || $request->budget_max)
- Budget: {{ $request->budget_min ? number_format((float) $request->budget_min, 2) : 'N/A' }}{{ $request->budget_max ? ' - ' . number_format((float) $request->budget_max, 2) : '' }}
@endif
</x-mail::panel>

@if($request->description)
**Notes from you**

{{ $request->description }}
@endif

<x-mail::button :url="$trackingUrl">
View Request Status
</x-mail::button>

Need to add more info? Reply to this email and we will update the brief for you.

Thanks,<br>
{{ config('app.name') }} Support Team
</x-mail::message>
