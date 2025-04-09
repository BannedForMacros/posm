<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $fillable = [
        'ruc',
        'razon_social',
        'direccion',
        'telefono',
        'email',
        'estado',
        'created_at',
        'updated_at',
        'user_ruc'
    ];

    public $timestamps = false;

    // Si deseas que Laravel maneje created_at y updated_at, 
    // define $timestamps = true y renombra las columnas en tu tabla 
    // a 'created_at' y 'updated_at' sin personalizaciones.
}
