<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Limits filters and sorting to supported values. Pages start at one. */
class ExpenseFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month' => ['nullable', 'date_format:Y-m'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'search' => ['nullable', 'string', 'max:150'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'sort' => ['sometimes', Rule::in(['spent_on', 'amount', 'title'])],
            'direction' => ['sometimes', Rule::in(['asc', 'desc'])],
        ];
    }
}
