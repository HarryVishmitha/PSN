<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->can('manage-payment-methods') ?? false; }

    public function rules(): array
    {
        $method = $this->route('method');
        $id     = $method?->id;
        return [
            'display_name'     => ['required','string','max:120'],
            'code'             => ['required','string','max:60',"unique:payment_methods,code,$id"],
            'type'             => ['required','in:static,custom,gateway'],
            'flow'             => ['required','in:cod,manual,online'],
            'status'           => ['required','in:active,inactive'],
            'fee_type'         => ['nullable','in:none,flat,percent'],
            'fee_value'        => ['nullable','numeric','min:0'],
            'min_order_total'  => ['nullable','numeric','min:0'],
            'max_order_total'  => ['nullable','numeric','gte:min_order_total'],
            'allowed_currencies'   => ['nullable','array'],
            'allowed_currencies.*' => ['string','max:10'],
            'instructions'     => ['nullable','string'],
            'config'           => ['nullable','array'],
            'sort_order'       => ['nullable','integer','min:0'],
            'logo_path'        => ['nullable','string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Normalize fee_type when empty
        if ($this->has('fee_type') && $this->input('fee_type') === 'none') {
            $this->merge(['fee_value' => null]);
        }
        // Normalize empty arrays
        if ($this->input('allowed_currencies') === '') $this->merge(['allowed_currencies' => null]);
    }
}
