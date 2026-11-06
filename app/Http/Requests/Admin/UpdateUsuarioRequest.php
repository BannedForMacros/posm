<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->esSuperadmin() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('usuario')),
            ],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'is_superadmin' => ['sometimes', 'boolean'],
            'activo' => ['sometimes', 'boolean'],
            'empresas' => ['nullable', 'array'],
            'empresas.*.id' => ['required', 'integer', Rule::exists('empresas', 'id')],
            'empresas.*.rol' => ['required', 'string', Rule::in(['admin', 'operador'])],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Ya existe un usuario con ese correo.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
            'empresas.*.id.exists' => 'Una de las empresas seleccionadas no existe.',
        ];
    }
}
