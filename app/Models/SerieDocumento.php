<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/** Serie de comprobante de una empresa (F001, B001, T001...). */
class SerieDocumento extends Model
{
    protected $table = 'series_documento';

    protected $fillable = ['ruc', 'cod_documento', 'serie', 'estado'];

    protected $casts = ['estado' => 'boolean'];

    public function scopeActivas($query, ?string $ruc, ?string $codDocumento = null)
    {
        return $query->where('ruc', $ruc)
            ->where('estado', true)
            ->when($codDocumento, fn ($q) => $q->where('cod_documento', $codDocumento))
            ->orderBy('serie');
    }

    /**
     * Siguiente correlativo: último número emitido en `ventas` para esta empresa,
     * tipo y serie + 1. Los números se guardan sin ceros a la izquierda (igual que el
     * POS de escritorio).
     */
    public static function siguienteCorrelativo(string $ruc, string $codDocumento, string $serie): int
    {
        $query = DB::table('ventas')
            ->where('RUCEMPRESA', $ruc)
            ->where('COD_DOCUMENTO', $codDocumento)
            ->where('SERI_VENTA', $serie);

        if (DB::getDriverName() === 'pgsql') {
            $query->whereRaw('"NUME_VENTA" ~ \'^[0-9]{1,18}$\'');
        }

        return ((int) $query->max(DB::raw('CAST("NUME_VENTA" AS BIGINT)'))) + 1;
    }
}
