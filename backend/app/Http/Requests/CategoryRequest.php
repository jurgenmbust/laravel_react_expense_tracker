<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Validates category input; the database also checks names ignoring case. */
class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80', Rule::unique('categories')->ignore($this->route('category'))],
            'color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ];
    }
}
