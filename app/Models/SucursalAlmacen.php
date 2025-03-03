<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SucursalAlmacen extends Model
{
    protected $table = 'sucursal_almacen';

    protected $fillable = [
        'sucursal_id',
        'almacen_id',
        'estado'
    ];

    public $timestamps = true;
}
