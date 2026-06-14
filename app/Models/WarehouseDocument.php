<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Operacion;
use App\Models\User;
use App\Models\WarehouseDocumentDetail;
use App\Models\Venta;
use App\Models\Facturacion;
use App\Models\Almacen; // si tienes un modelo de Almacen

class WarehouseDocument extends Model
{
    protected $table = 'warehouse_document';

    protected $fillable = [
        'ruc',
        'almacen_id',
        'facturacion_id',  // Enlaza con la tabla Facturación (compra)
        'venta_id',        // Nueva columna para enlazar con la tabla ventas
        'user_id',
        'operacion_id',    // Por ejemplo, ID=1 => Compra, ID=2 => Venta, etc.
        'tipo_movimiento', // 'INGRESO', 'SALIDA', 'TRANSFERENCIA', etc.
        'fecha',
        'estado',
        'created_at',
        'updated_at'
    ];

    public $timestamps = false;

    // Relación con la tabla Operacion
    public function operacion()
    {
        return $this->belongsTo(Operacion::class, 'operacion_id', 'id');
    }

    // Relación con el almacén (si existe el modelo Almacen)
    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'almacen_id', 'id');
    }

    // Relación con el usuario que creó el documento
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // Relación con Facturación (compra)
    public function facturacion()
    {
        return $this->belongsTo(Facturacion::class, 'facturacion_id', 'id');
    }

    // NOTA: se eliminó la relación venta() — la FK warehouse_document.venta_id
    // referencia a ventas_backup(id); la tabla ventas real no tiene columna id,
    // por lo que cargar esa relación lanzaba "Column not found".

    // Relación con los detalles del documento de almacén
    public function detalles()
    {
        return $this->hasMany(WarehouseDocumentDetail::class, 'warehouse_document_id');
    }
}
