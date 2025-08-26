<?php

// app/Http/Requests/Admin/SyncProductRollsRequest.php
namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SyncProductRollsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // already behind admin middleware; you could add Gate checks here
        return true;
    }

    public function rules(): array
    {
        return [
            'roll_ids'   => ['array'],
            'roll_ids.*' => ['integer', 'distinct', 'exists:rolls,id'], // 👈 distinct!
            'default_roll' => ['nullable', 'integer', 'exists:rolls,id'],
        ];
    }
}
