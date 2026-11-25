<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Validates create and update input before controller execution. */
class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:9999999999.99', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
            'spent_on' => ['required', 'date_format:Y-m-d'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Escribe un concepto para el gasto.',
            'amount.*' => 'Ingresa un monto mayor que cero, con hasta dos decimales.',
            'category_id.*' => 'Selecciona una categoría existente.',
            'spent_on.*' => 'Ingresa una fecha válida (AAAA-MM-DD).',
        ];
    }
}
