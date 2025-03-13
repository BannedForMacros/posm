<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventario extends Model
{
    protected $table = 'inventario'; // tu tabla real
    public $timestamps = true;       // si tienes created_at, updated_at

    protected $fillable = [
        'ruc',
        'almacen_id',
        'cod_articulo',
        'stock'
    ];

    // Relación con la tabla "almacen" (si existe)
    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    // Relación con la tabla "articulo" (si existe)
    public function articulo()
    {
        // PK de articulo = codarticulo, FK en inventario = cod_articulo
        return $this->belongsTo(Articulo::class, 'cod_articulo', 'codarticulo');
    }
}
