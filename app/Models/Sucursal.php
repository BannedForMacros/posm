<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sucursal extends Model
{
    protected $table = 'sucursal';

    protected $primaryKey = 'id';
    public $timestamps = false; // Si manejas created_at, updated_at manualmente, o si no quieres timestamps automáticos

    protected $fillable = [
        'user_ruc',
        'nombre',
        'direccion',
        'estado',
        'created_at',
        'updated_at'
    ];
}
