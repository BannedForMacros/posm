<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentasDetalle extends Model
{
    // Nombre de la tabla en la BD
    protected $table = 'ventasdetalle';

    // Clave primaria es 'id' (auto-increment)
    protected $primaryKey = 'id';
    public $incrementing = true;   // Indicamos que es auto-increment
    protected $keyType = 'int';    // o 'bigint'

    public $timestamps = false;    // Si no manejas created_at/updated_at

    /**
     * Columnas que se pueden asignar de forma masiva
     * (ajusta a tus campos reales).
     */
    protected $fillable = [
        'venta_id',         // la columna que enlaza con ventas(id)
        'COD_DOCUMENTO',
        'SERI_VENTA',
        'NUME_VENTA',
        'COD_ARTICULO',
        'CANT_VENTASD',
        'PUNI_VENTASD',
        'IMPU_VENTASD',
        'TNETO_VENTASD',
        'TDESC_VENTASD',
        'TIMP_VENTASD',
        // etc. según tu tabla
    ];

    /**
     * Relación con la venta (cabecera).
     */
    public function venta()
    {
        // belongsTo(<ModeloCabecera>, <columnaFK_en_esta_tabla>, <columnaPK_en_la_otratabla>)
        return $this->belongsTo(Venta::class, 'venta_id', 'id');
    }
}
