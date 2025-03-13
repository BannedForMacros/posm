<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Operacion extends Model
{
    protected $table = 'operacion';

    protected $fillable = [
        'descripcion',
        'tipo_movimiento',
        'cod_sunat',
        'estado',
        'created_at',
        'updated_at'
    ];

    public $timestamps = false;
}
