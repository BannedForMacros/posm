<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VentasDetalle extends Model
{
    use HasFactory;

    protected $table = 'ventasdetalle'; // Nombre de la tabla en la BD
    protected $primaryKey = 'ID_VENTASD'; // Clave primaria
    public $timestamps = false; // Deshabilita timestamps si la tabla no los tiene

    protected $fillable = [
        'COD_DOCUMENTO',
        'SERI_VENTA',
        'NUME_VENTA',
        'ID_VENTASD',
        'COD_ARTICULO',
        'COD_UNIDADM',
        'CANT_VENTASD',
        'PUNI_VENTASD',
        'IMPU_VENTASD',
        'TNETO_VENTASD',
        'TDESC_VENTASD',
        'TIMP_VENTASD',
        'ESTA_VENTASD',
        'NC_VENTAD',
        'CANTNC_VENTAD',
        'NCRELACIONADO_VENTAD',
        'FEC_CREA',
        'FEC_MOD',
        'CREA_USUARIO',
        'MOD_USUARIO',
        'TIP_IGV',
        'TASA_IMP',
        'TDESC_PORC_VENTASD',
        'CODIGOARTIINTERNO',
        'UNIDADMEDIDA',
        'CODSUCURSAL',
        'CODIGOSUNAT',
        'TIPOAFECTACION',
        'TIPOPRECIOVENTA',
        'MONTOICBPER'
    ];
}
