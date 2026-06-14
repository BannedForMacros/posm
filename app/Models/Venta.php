<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    // Nombre real de la tabla en tu BD
    protected $table = 'ventas';

    // OJO: la tabla ventas NO tiene columna `id`. Su clave primaria es
    // compuesta: (COD_DOCUMENTO, SERI_VENTA, NUME_VENTA, RUCEMPRESA).
    // Eloquent no soporta PK compuestas, así que este modelo solo debe
    // usarse para consultas con where(), nunca find()/save() por PK.
    protected $primaryKey = null;
    public $incrementing = false;

    // Si no manejas created_at y updated_at de forma automática
    public $timestamps = false;

    /**
     * Si deseas usar asignación masiva (mass assignment),
     * define aquí las columnas permitidas en $fillable.
     * Ajusta según tus columnas reales.
     */
    protected $fillable = [
        'COD_DOCUMENTO',
        'SERI_VENTA',
        'NUME_VENTA',
        'ID_CLIENTE',
        'FEMI_VENTA',
        'TNETO_VENTA',
        'TDES_VENTA',
        'IMPU_VENTA',
        'TOTAL_VENTA',
        'RUCEMPRESA',
        // Las columnas reales de sucursal/almacén en ventas son
        // CODIGOSUCURSAL y CODALMACEN (no existen sucursal_id/almacen_id).
        'CODIGOSUCURSAL',
        'CODALMACEN',
    ];

    // NOTA: no hay relación detalles() — ventasdetalle no tiene columna
    // venta_id; el vínculo real es por (COD_DOCUMENTO, SERI_VENTA, NUME_VENTA),
    // que Eloquent no soporta como FK compuesta. Los detalles se obtienen
    // vía SP ObtenerDetallesVenta.
}
