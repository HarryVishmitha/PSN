<?php

// app/Http/Requests/StoreEstimateRequest.php
use Illuminate\Foundation\Http\FormRequest;

class StoreEstimateRequest extends FormRequest {
    public function rules(): array {
        return [
            'estimate_number' => ['required','string','max:50','unique:estimates,estimate_number'],
            'working_group_id'=> ['required','exists:working_groups,id'],
            'client_name'     => ['required','string','max:255'],
            'items'           => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.qty'        => ['required','numeric','min:1'],
            'items.*.unit'       => ['nullable','string','max:32'],
            'items.*.description'=> ['nullable','string'],
            // roll fields (conditionally required)
            'items.*.is_roll'           => ['boolean'],
            'items.*.roll_id'           => ['required_if:items.*.is_roll,1','nullable','exists:rolls,id'],
            'items.*.cut_width_in'      => ['required_if:items.*.is_roll,1','nullable','numeric','gt:0'],
            'items.*.cut_height_in'     => ['required_if:items.*.is_roll,1','nullable','numeric','gt:0'],
            'items.*.offcut_price_per_sqft' => ['nullable','numeric','gte:0'],
        ];
    }
}
