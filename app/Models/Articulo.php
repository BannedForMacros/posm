<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Articulo extends Model
{
    protected $table = 'articulos';        // Tabla real en la DB
    protected $primaryKey = 'codarticulo'; // PK distinta a 'id'
    public $timestamps = false;            // No tiene created_at/updated_at

    protected $fillable = [
        'codfamilia',
        'codsubfamilia',
        'nombrearticulo',
        'ruc',
        'nombrecorto',
        'stockminimo',
        'stockmaximo',
        'tipoigv',
        'codbarra',
        'foto',
        'codigosunat',
        'icbper',
        'montoicbper',
        'controlpeso',
        'codartnue',
        'estado'
    ];

    /**
     * Relación con los detalles de almacén.
     * 'cod_articulo' es la FK en warehouse_document_detail,
     * 'codarticulo' es la PK en esta tabla 'articulos'.
     */
    public function warehouseDetails()
    {
        return $this->hasMany(WarehouseDocumentDetail::class, 'cod_articulo', 'codarticulo');
    }
}
