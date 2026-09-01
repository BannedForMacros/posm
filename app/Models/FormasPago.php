<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormasPago extends Model
{
    use HasFactory;

    protected $table = 'ventaformapago'; // Nombre de la tabla en la BD

    /**
     * La tabla `ventaformapago` no tiene PRIMARY KEY definida.
     * `ID_FPAGO` no es un identificador unico: es el codigo de la forma de pago
     * (ej. 1=efectivo, 2=tarjeta, etc.) y se repite en muchas ventas.
     * La relacion real con la venta es por el trio (COD_DOCUMENTO, SERI_VENTA, NUME_VENTAS).
     *
     * Por eso se desactiva la clave primaria simple de Eloquent. Este modelo
     * solo se utiliza como contenedor / referencia; no se emplea con find() ni save().
     */
    protected $primaryKey = null;

    public $incrementing = false;

    protected $keyType = 'string';

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
