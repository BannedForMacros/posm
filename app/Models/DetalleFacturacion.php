<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleFacturacion extends Model
{
    protected $table = 'DetalleFacturacion';

    protected $fillable = [
        'facturacion_id',
        'cod_articulo',
        'cantidad',
        'precio_unitario',
        'estado',
        'created_at',
        'updated_at'
    ];

    public $timestamps = false;

    public function articulo()
    {
        return $this->belongsTo(Articulo::class, 'cod_articulo', 'codarticulo');
    }

    public function facturacion()
    {
        return $this->belongsTo(Facturacion::class, 'facturacion_id', 'id');
    }
}
