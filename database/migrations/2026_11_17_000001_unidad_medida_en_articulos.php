<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Unidad de medida del artículo.
 *
 * - `articulos.codunidad`: FK lógica a `unidadmedida` (por defecto 1 = unidad / NIU).
 * - `unidadmedida`: completa las unidades SUNAT más usadas y corrige "kilogramo" (KGM).
 */
return new class extends Migration
{
    private const UNIDADES = [
        // [unidad, sigla SUNAT, sigla corta]
        ['unidad', 'NIU', 'Uni'],
        ['kilogramo', 'KGM', 'Kg'],
        ['gramo', 'GRM', 'g'],
        ['litro', 'LTR', 'L'],
        ['mililitro', 'MLT', 'ml'],
        ['metro', 'MTR', 'm'],
        ['caja', 'BX', 'Caja'],
        ['paquete', 'PK', 'Paq'],
        ['docena', 'DZN', 'Doc'],
        ['galón', 'GLL', 'Gal'],
        ['bolsa', 'BG', 'Bolsa'],
        ['botella', 'BO', 'Bot'],
        ['servicio', 'ZZ', 'Serv'],
    ];

    public function up(): void
    {
        if (Schema::hasTable('articulos') && ! Schema::hasColumn('articulos', 'codunidad')) {
            Schema::table('articulos', function (Blueprint $table) {
                $table->integer('codunidad')->nullable()->default(1);
            });
            DB::table('articulos')->whereNull('codunidad')->update(['codunidad' => 1]);
        }

        if (Schema::hasTable('unidadmedida')) {
            $this->completarUnidades();
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('articulos') && Schema::hasColumn('articulos', 'codunidad')) {
            Schema::table('articulos', fn (Blueprint $table) => $table->dropColumn('codunidad'));
        }
    }

    private function completarUnidades(): void
    {
        // Alinear la identidad antes de insertar (tras la carga MySQL -> PG puede estar desfasada).
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SELECT setval(pg_get_serial_sequence('unidadmedida', 'codunidad'), COALESCE((SELECT MAX(codunidad) FROM unidadmedida), 0) + 1, false)");
        }

        // "kilogramo" se cargó con la sigla de unidad (NIU): la correcta en SUNAT es KGM.
        DB::table('unidadmedida')
            ->whereRaw('LOWER(unidad) = ?', ['kilogramo'])
            ->where('siglasunat', 'NIU')
            ->update(['siglasunat' => 'KGM']);

        $existentes = DB::table('unidadmedida')->pluck('siglasunat')->map(fn ($s) => strtoupper((string) $s))->all();
        foreach (self::UNIDADES as [$unidad, $sigla, $corta]) {
            if (in_array($sigla, $existentes, true)) {
                continue;
            }
            DB::table('unidadmedida')->insert([
                'unidad' => $unidad,
                'cantidad' => 1,
                'siglasunat' => $sigla,
                'fecha' => now()->format('Y-m-d'),
                'usuario' => 'sistema',
                'siglaunidadDMK' => $corta,
            ]);
        }

    }
};
