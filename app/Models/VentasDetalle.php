<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentasDetalle extends Model
{
    // Nombre de la tabla en la BD
    protected $table = 'ventasdetalle';

    // OJO: la tabla ventasdetalle no tiene columna `id` ni `venta_id`;
    // el vínculo con ventas es por (COD_DOCUMENTO, SERI_VENTA, NUME_VENTA).
    protected $primaryKey = null;
    public $incrementing = false;

    public $timestamps = false;    // Si no manejas created_at/updated_at

    /**
     * Columnas que se pueden asignar de forma masiva
     * (ajusta a tus campos reales).
     */
    protected $fillable = [
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

    // NOTA: no hay relación venta() — la columna venta_id no existe en esta
    // tabla; el vínculo real es la clave compuesta (COD_DOCUMENTO,
    // SERI_VENTA, NUME_VENTA), que Eloquent no soporta.
}
