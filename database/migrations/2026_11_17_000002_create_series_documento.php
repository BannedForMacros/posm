<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Series de comprobante por empresa y tipo (01 Factura, 03 Boleta, 12 Ticket).
 * Alimenta el desplegable de serie de "Crear venta"; el correlativo se calcula sobre `ventas`.
 * Se precarga con las series que ya usan las ventas existentes (POS de escritorio).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('series_documento')) {
            Schema::create('series_documento', function (Blueprint $table) {
                $table->id();
                $table->string('ruc', 11);
                $table->char('cod_documento', 2);
                $table->string('serie', 4);
                $table->boolean('estado')->default(true);
                $table->timestamps();
                $table->unique(['ruc', 'cod_documento', 'serie']);
            });
            $this->precargarSeries();
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('series_documento');
    }

    private function precargarSeries(): void
    {
        if (! Schema::hasTable('ventas')) {
            return;
        }

        $ahora = now();
        DB::table('ventas')
            ->select('RUCEMPRESA', 'COD_DOCUMENTO', 'SERI_VENTA')
            ->distinct()
            ->get()
            ->filter(fn ($v) => in_array(trim($v->COD_DOCUMENTO), ['01', '03', '12'], true)
                && preg_match('/^[A-Z0-9]{1,4}$/', trim((string) $v->SERI_VENTA)))
            ->each(fn ($v) => DB::table('series_documento')->insertOrIgnore([
                'ruc' => $v->RUCEMPRESA,
                'cod_documento' => trim($v->COD_DOCUMENTO),
                'serie' => trim($v->SERI_VENTA),
                'estado' => true,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]));
    }
};
