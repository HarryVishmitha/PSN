<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class SupportRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $categoryConfig = config('support-requests.categories.' . $this->category, []);
        $categoryLabel = $categoryConfig['label'] ?? Str::title(str_replace('-', ' ', $this->category));

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'tracking_token' => $this->tracking_token,
            'tracking_url' => route('requests.track', $this->tracking_token),
            'status' => $this->status,
            'category' => [
                'value' => $this->category,
                'label' => $categoryLabel,
                'other' => $this->other_category,
            ],
            'contact' => [
                'name' => $this->name,
                'company' => $this->company,
                'email' => $this->email,
                'phone_whatsapp' => $this->phone_whatsapp,
            ],
            'title' => $this->title,
            'description' => $this->description,
            'specs' => $this->specs ?? [],
            'desired_date' => optional($this->desired_date)->toDateString(),
            'flexibility' => $this->flexibility,
            'budget' => [
                'min' => $this->budget_min !== null ? (float) $this->budget_min : null,
                'max' => $this->budget_max !== null ? (float) $this->budget_max : null,
            ],
            'approved_at' => optional($this->approved_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'files' => $this->whenLoaded('files', function () {
                return $this->files->map(fn($file) => [
                    'id' => $file->id,
                    'name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size' => $file->size,
                    'url' => $file->url,
                    'download_url' => route('requests.files.download', [
                        'token' => $this->tracking_token,
                        'file' => $file->id,
                    ]),
                ]);
            }),
            'messages' => $this->whenLoaded('messages', function () {
                return $this->messages->map(fn($message) => [
                    'id' => $message->id,
                    'sender_type' => $message->sender_type,
                    'sender_name' => optional($message->sender)->name,
                    'body' => $message->body,
                    'attachments' => $message->attachments,
                    'created_at' => optional($message->created_at)->toIso8601String(),
                ]);
            }),
        ];
    }
}
