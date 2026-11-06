<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmpresaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->esSuperadmin() === true;
    }

    public function rules(): array
    {
        return [
            // El RUC identifica al tenant: no se permite modificarlo.
            'ruc' => ['sometimes', 'prohibited'],
            'razon_social' => ['required', 'string', 'max:200'],
            'nombre_comercial' => ['nullable', 'string', 'max:200'],
            'direccion' => ['nullable', 'string', 'max:200'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'estado' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'ruc.prohibited' => 'El RUC de una empresa no se puede modificar.',
            'razon_social.required' => 'La razón social es obligatoria.',
        ];
    }
}
