<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AsignarEmpresaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->esSuperadmin() === true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'rol' => ['required', 'string', Rule::in(['admin', 'operador'])],
        ];
    }
}
