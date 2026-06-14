<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventarioInicial extends Model
{
    protected $table = 'inventario_inicial';

    // NOTA: la tabla inventario_inicial NO tiene columna sucursal_id;
    // incluirla en fillable provocaría "Column not found" en mass-assignment.
    protected $fillable = [
        'ruc',
        'almacen_id',
        'cod_articulo',
        'stock_inicial',
        'stock_minimo',
        'stock_maximo',
        'activo'
    ];

    public $timestamps = true; // Si tu tabla tiene created_at, updated_at
}
