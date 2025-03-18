<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventarioInicial extends Model
{
    protected $table = 'inventario_inicial';

    protected $fillable = [
        'ruc',
        'sucursal_id',
        'almacen_id',
        'cod_articulo',
        'stock_inicial',
        'stock_minimo',
        'stock_maximo',
        'activo'
    ];

    public $timestamps = true; // Si tu tabla tiene created_at, updated_at
}
