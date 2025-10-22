<x-mail::message>
# Update on {{ $request->reference }}

Our team just shared a new update on your request.

<x-mail::panel>
**Latest message**

{{ $message->body }}
</x-mail::panel>

Current status: **{{ ucfirst(str_replace('_', ' ', $request->status)) }}**

<x-mail::button :url="$trackingUrl">
View full timeline
</x-mail::button>

You can reply directly to this email if you have more details to add.

Thanks,<br>
{{ config('app.name') }} Support Team
</x-mail::message>
