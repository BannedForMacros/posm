<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLocalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->esSuperadmin() === true;
    }

    public function rules(): array
    {
        return [
            'empresa_id' => ['required', 'integer', Rule::exists('empresas', 'id')],
            'nombre' => ['required', 'string', 'max:100'],
            'direccion' => ['nullable', 'string', 'max:200'],
            'estado' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'empresa_id.required' => 'Selecciona la empresa del local.',
            'empresa_id.exists' => 'La empresa seleccionada no existe.',
            'nombre.required' => 'El nombre del local es obligatorio.',
        ];
    }
}
