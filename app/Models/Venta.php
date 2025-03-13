<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    // Nombre real de la tabla en tu BD
    protected $table = 'ventas';

    // La PK es 'id' (auto-increment)
    protected $primaryKey = 'id';
    public $incrementing = true;   // Indicamos que es auto-increment
    protected $keyType = 'int';    // o 'bigint', según tu definición

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
        'sucursal_id',
        'almacen_id',
        // etc. (agrega las que necesites)
    ];

    /**
     * Relación con el detalle (ventasdetalle).
     * Indica que una venta tiene muchos detalles.
     */
    public function detalles()
    {
        // hasMany(<ModeloDetalle>, <clave_foranea_en_detalle>, <clave_pk_en_esta_tabla>)
        return $this->hasMany(VentasDetalle::class, 'venta_id', 'id');
    }
}
