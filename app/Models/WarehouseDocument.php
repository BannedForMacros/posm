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

    // NOTA: no existe relación venta().
    //
    // La FK warehouse_document.venta_id apunta a ventas_backup(id) como
    // referencia legacy / scaffolding: la tabla ventas real no tiene columna
    // id (su PK es compuesta: COD_DOCUMENTO, SERI_VENTA, NUME_VENTA, RUCEMPRESA),
    // por lo que no puede ser destino de una FK simple.
    //
    // En la práctica actual:
    //  - ventas_backup está vacía y no recibe escrituras.
    //  - warehouse_document.venta_id siempre se guarda como NULL en nuevas ventas
    //    (ver VentasController::store), porque no hay PK simple a la cual enlazar.
    //  - Cargar una relación belongsTo('Venta') fallaría con "Column not found"
    //    si venta_id tuviera un valor no nulo, ya que App\Models\Venta usa la
    //    tabla ventas que no posee columna id.
    //
    // Si en el futuro se decide vincular documentos de almacén con ventas, las
    // opciones seguras son:
    //  1) Agregar columnas (cod_documento, seri_venta, nume_venta, ruc_empresa)
    //     a warehouse_document y crear una FK compuesta hacia ventas.
    //  2) Agregar una columna id surrogate a ventas (riesgosa por el POS
    //     de escritorio que ya usa la PK compuesta).
    //  3) Eliminar la columna venta_id y la FK si finalmente no se usa.
    // Cualquiera de estas opciones requiere coordinación con el equipo del POS
    // de escritorio y validación de datos previa.

    // Relación con los detalles del documento de almacén
    public function detalles()
    {
        return $this->hasMany(WarehouseDocumentDetail::class, 'warehouse_document_id');
    }
}
