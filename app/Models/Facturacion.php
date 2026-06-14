<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facturacion extends Model
{
    protected $table = 'facturacion';

    protected $fillable = [
        'tipo_documento',
        'num_serie',
        'num_documento',
        'cod_proveedor',
        'fecha',
        'valor_compra',
        'estado',
        'created_at',
        'updated_at'
    ];

    public $timestamps = false;

    public function detalles()
    {
        return $this->hasMany(DetalleFacturacion::class, 'facturacion_id', 'id');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'cod_proveedor', 'id');
    }
}
