<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListaPrecios extends Model
{
    protected $table = 'lista_precios';
    protected $primaryKey = 'id';
    public $timestamps = false; // si no usas created_at, updated_at automáticos, o pon true si sí

    protected $fillable = [
        'ruc',
        'nombre',
        'estado',
        'created_at',
        'updated_at'
    ];

    // Relación con detalle_lista_precios
    public function detalles()
    {
        return $this->hasMany(DetalleListaPrecios::class, 'lista_precios_id', 'id');
    }
}
