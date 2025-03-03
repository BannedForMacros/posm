<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Articulo extends Model
{
    // Si la tabla en la base de datos es 'articulos'
    protected $table = 'articulos';

    // Si la clave primaria es 'codarticulo' y no 'id'
    protected $primaryKey = 'codarticulo';

    // Indica que no existen columnas de timestamps (created_at, updated_at)
    public $timestamps = false;

    // Campos que se pueden asignar en masa (mass assignment)
    protected $fillable = [
        'codfamilia', 'codsubfamilia', 'nombrearticulo', 'nombrecorto', 
        'stockminimo', 'stockmaximo', 'tipoigv', 'codbarra', 'foto',
        'codigosunat', 'icbper', 'montoicbper', 'controlpeso', 'codartnue', 'estado'
    ];
}
