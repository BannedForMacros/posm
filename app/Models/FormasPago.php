<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormasPago extends Model
{
    use HasFactory;

    protected $table = 'ventaformapago'; // Nombre de la tabla en la BD
    protected $primaryKey = 'ID_FPAGO'; // Clave primaria
    public $timestamps = false; // Deshabilita timestamps si la tabla no los tiene

    protected $fillable = [
        'NUME_VENTAS',
        'COD_DOCUMENTO',
        'SERI_VENTA',
        'ID_FPAGO',
        'TMONT_FORMAP',
        'NUM_FORMAP',
        'SER_FORMAP',
        'TCAMB_FORMAP',
        'TMOC_FORMAP',
        'ESTA_FORMAP',
        'REFE_FORMAP',
        'FEC_CREA',
        'FEC_MOD',
        'CREA_USUARIO',
        'MOD_USUARIO',
        'CODTARJETA',
        'CODSUCURSAL'
    ];
}
