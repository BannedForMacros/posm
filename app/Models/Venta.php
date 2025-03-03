<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    // Nombre de la tabla
    protected $table = 'ventas';

    // Desactivar la auto-incrementación (ya que la tabla usa clave compuesta)
    public $incrementing = false;

    // Desactivar timestamps si no se usan de forma automática
    public $timestamps = false;

    // Permitir asignación masiva de todos los campos
    protected $guarded = [];
}
