<x-mail::message>
# New support request {{ $request->reference }}

A customer just submitted a new brief. Review the details and follow up.

<x-mail::panel>
**Contact**

- Name: {{ $request->name }}
- Email: {{ $request->email }}
- WhatsApp: {{ $request->phone_whatsapp }}
@if($request->company)
- Company: {{ $request->company }}
@endif
</x-mail::panel>

<x-mail::panel>
**Request**

- Title: {{ $request->title }}
- Category: {{ config('support-requests.categories.' . $request->category . '.label') ?? ucfirst(str_replace('-', ' ', $request->category)) }}
@if($request->desired_date)
- Desired date: {{ \Illuminate\Support\Carbon::parse($request->desired_date)->toFormattedDateString() }}
@endif
@if($request->budget_min || $request->budget_max)
- Budget: {{ $request->budget_min ? number_format((float) $request->budget_min, 2) : 'N/A' }}{{ $request->budget_max ? ' - ' . number_format((float) $request->budget_max, 2) : '' }}
@endif
</x-mail::panel>

@if($request->description)
**Customer notes**

{{ $request->description }}
@endif

@if($request->files->isNotEmpty())
Attachments ({{ $request->files->count() }} file{{ $request->files->count() === 1 ? '' : 's' }}):
@foreach($request->files as $file)
- {{ $file->original_name }} ({{ number_format($file->size / 1024 / 1024, 2) }} MB)
@endforeach
@endif

<x-mail::button :url="$adminUrl">
View in Admin
</x-mail::button>

Thanks,<br>
{{ config('app.name') }} Bot
</x-mail::message>
