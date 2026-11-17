<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Cliente de una empresa (DNI/RUC). Único por (ruc_empresa, numero_documento). */
class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'ruc_empresa', 'tipo_documento', 'numero_documento', 'razon_social', 'direccion', 'correo', 'fuente',
    ];

    public function scopeDeEmpresa($query, ?string $ruc)
    {
        return $query->where('ruc_empresa', $ruc);
    }
}
