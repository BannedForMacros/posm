<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseDocumentDetail extends Model
{
    protected $table = 'warehouse_document_detail';

    protected $fillable = [
        'warehouse_document_id',
        'cod_articulo',
        'cantidad',
        'precio_unitario',
        'costo',
        'estado',
        'created_at',
        'updated_at'
    ];

    public $timestamps = false;

    public function warehouseDocument()
    {
        return $this->belongsTo(WarehouseDocument::class, 'warehouse_document_id');
    }

    public function articulo()
    {
        return $this->belongsTo(Articulo::class, 'cod_articulo', 'codarticulo');
    }
}