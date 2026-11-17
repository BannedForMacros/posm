<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Clientes por empresa (DNI/RUC). Se precarga con los clientes de las ventas existentes
 * para que al escribir el documento en "Crear venta" se recuperen sus datos guardados.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('clientes')) {
            Schema::create('clientes', function (Blueprint $table) {
                $table->id();
                $table->string('ruc_empresa', 11);
                $table->string('tipo_documento', 3);           // DNI | RUC
                $table->string('numero_documento', 11);
                $table->string('razon_social', 150);
                $table->string('direccion', 150)->nullable();
                $table->string('correo', 150)->nullable();
                $table->string('fuente', 10)->default('manual'); // manual | consulta | venta
                $table->timestamps();
                $table->unique(['ruc_empresa', 'numero_documento']);
            });
            $this->precargarClientes();
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }

    private function precargarClientes(): void
    {
        if (! Schema::hasTable('ventas')) {
            return;
        }

        $ahora = now();
        // La venta más reciente de cada cliente trae sus datos más actuales.
        DB::table('ventas')
            ->select('RUCEMPRESA', 'NUMERODOCUMENTOCLI', 'RAZONSOCIALCLI', 'DIRECCIONCLI', 'CORREOCLI', 'fec_crea')
            ->whereNotNull('NUMERODOCUMENTOCLI')
            ->orderByDesc('fec_crea')
            ->get()
            ->map(function ($v) {
                $v->doc = preg_replace('/\D/', '', (string) $v->NUMERODOCUMENTOCLI);

                return $v;
            })
            ->filter(fn ($v) => in_array(strlen($v->doc), [8, 11], true)
                && ! preg_match('/^0+$/', $v->doc)
                && trim((string) $v->RAZONSOCIALCLI) !== '')
            ->unique(fn ($v) => $v->RUCEMPRESA.'|'.$v->doc)
            ->each(fn ($v) => DB::table('clientes')->insertOrIgnore([
                'ruc_empresa' => $v->RUCEMPRESA,
                'tipo_documento' => strlen($v->doc) === 11 ? 'RUC' : 'DNI',
                'numero_documento' => $v->doc,
                'razon_social' => mb_substr(trim($v->RAZONSOCIALCLI), 0, 150),
                'direccion' => filled($v->DIRECCIONCLI) ? mb_substr(trim($v->DIRECCIONCLI), 0, 150) : null,
                'correo' => filled($v->CORREOCLI) ? mb_substr(trim($v->CORREOCLI), 0, 150) : null,
                'fuente' => 'venta',
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]));
    }
};
