<?php

namespace App\Http\Requests;

use App\Models\SupportRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminSupportRequestMessageRequest extends FormRequest
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
        if ($this->has('notify_customer')) {
            $this->merge([
                'notify_customer' => filter_var($this->input('notify_customer'), FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string'],
            'status' => ['nullable', 'string', Rule::in(SupportRequest::STATUSES)],
            'notify_customer' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'message.required' => 'Please enter a reply to send to the customer.',
        ];
    }
}
