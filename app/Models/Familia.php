<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Familia extends Model
{
    // Tabla en la BD
    protected $table = 'familia';

    // Clave primaria
    protected $primaryKey = 'codfamilia';   // si en tu tabla familia la PK es 'codfamilia'
    public $incrementing = false;           // si 'codfamilia' no es autoincremental
    protected $keyType = 'string';          // si es VARCHAR

    // Desactivamos timestamps (si la tabla no tiene created_at / updated_at)
    public $timestamps = false;

    // Campos rellenables en las operaciones de create/update
    protected $fillable = [
        'ruc',
        'familia',
        'subfamilia',
        'estado',
    ];
}
