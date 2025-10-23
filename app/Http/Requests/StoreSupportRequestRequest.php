<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupportRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $budget = $this->input('budget');
        if (is_array($budget)) {
            $this->merge([
                'budget_min' => $budget['min'] ?? null,
                'budget_max' => $budget['max'] ?? null,
            ]);
        }

        if ($this->has('consent')) {
            $this->merge([
                'consent' => filter_var($this->input('consent'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    public function rules(): array
    {
        $categories = array_keys(config('support-requests.categories', []));
        if (empty($categories)) {
            $categories = ['other'];
        }
        $maxFiles = (int) config('support-requests.max_files', 5);
        $maxFileSize = (int) config('support-requests.max_file_size_mb', 50) * 1024;
        $mimeTypes = config('support-requests.allowed_mime_types', [
            'image/png',
            'image/jpeg',
            'application/pdf',
            'application/postscript',
            'image/vnd.adobe.photoshop',
        ]);

        return [
            'name' => ['required', 'string', 'max:120'],
            'company' => ['nullable', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:180'],
            'phone_whatsapp' => [
                'required',
                'string',
                'max:30',
                'regex:/^\+?[0-9\s\-\(\)]{7,20}$/',
            ],

            'category' => ['required', 'string', 'max:64', Rule::in($categories)],
            'other_category' => ['nullable', 'string', 'max:160', 'required_if:category,other'],

            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],

            'specs' => ['nullable', 'array'],
            'specs.size' => ['nullable', 'array'],
            'specs.size.width' => ['nullable', 'numeric', 'min:0.1'],
            'specs.size.height' => ['nullable', 'numeric', 'min:0.1'],
            'specs.size.unit' => ['nullable', 'string', 'max:10'],
            'specs.quantity' => ['nullable', 'integer', 'min:1'],
            'specs.sides' => ['nullable', 'integer', 'in:1,2'],
            'specs.color' => ['nullable', 'string', 'max:50'],
            'specs.material' => ['nullable', 'string', 'max:120'],
            'specs.finishing' => ['nullable', 'string', 'max:160'],
            'specs.delivery_type' => ['nullable', 'string', 'max:120'],

            'desired_date' => ['nullable', 'date', 'after_or_equal:today'],
            'flexibility' => ['nullable', 'string', 'in:exact,plusminus'],

            'budget_min' => ['nullable', 'numeric', 'min:0'],
            'budget_max' => ['nullable', 'numeric', 'gte:budget_min'],

            'consent' => ['accepted'],

            'files' => ['nullable', 'array', 'max:' . $maxFiles],
            'files.*' => ['file', 'max:' . $maxFileSize, 'mimetypes:' . implode(',', $mimeTypes)],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_whatsapp.regex' => 'Please provide a valid WhatsApp-capable number.',
            'consent.accepted' => 'You must agree to be contacted about this request.',
        ];
    }
}
