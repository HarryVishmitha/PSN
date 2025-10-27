<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutReviewRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function rules(): array
    {
        $slPhone = '/^(?:\+94|0)\d{9}$/';

        return [
            'first_name' => 'required|string|max:120',
            'last_name'  => 'required|string|max:120',
            'email'      => 'required|email:rfc,dns',
            'phone_primary' => ['required', 'regex:' . $slPhone],
            'phone_alt_1'   => ['nullable', 'regex:' . $slPhone],
            'phone_alt_2'   => ['nullable', 'regex:' . $slPhone],
            'whatsapp'      => ['required', 'regex:' . $slPhone],

            'is_company'     => 'boolean',
            'company_name'   => 'nullable|string|max:180',

            // billing
            'billing_address_line1' => 'required|string|max:255',
            'billing_address_line2' => 'nullable|string|max:255',
            'billing_city'          => 'required|string|max:120',
            'billing_province'      => 'nullable|string|max:120',
            'billing_postal'        => 'nullable|string|max:20',

            // shipping
            'shipping_same_as_billing' => 'boolean',
            'shipping_address_line1'   => 'required_unless:shipping_same_as_billing,true|string|max:255',
            'shipping_address_line2'   => 'nullable|string|max:255',
            'shipping_city'            => 'required_unless:shipping_same_as_billing,true|string|max:120',
            'shipping_province'        => 'nullable|string|max:120',
            'shipping_postal'          => 'nullable|string|max:20',

            'shipping_method_id' => 'nullable|exists:shipping_methods,id',
            'notes'              => 'nullable|string|max:2000',
            'accept_policy'      => 'accepted',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
