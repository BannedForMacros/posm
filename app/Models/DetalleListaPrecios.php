<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleListaPrecios extends Model
{
    protected $table = 'detalle_lista_precios';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'lista_precios_id',
        'cod_articulo',
        'precio',
        'estado',
        'created_at',
        'updated_at'
    ];

    // Relación con ListaPrecios
    public function listaPrecios()
    {
        return $this->belongsTo(ListaPrecios::class, 'lista_precios_id', 'id');
    }
}
