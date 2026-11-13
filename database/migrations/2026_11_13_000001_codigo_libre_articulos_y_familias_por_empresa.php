<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Artículos con código libre y familias por empresa.
 *
 * 1. `articulos.codigo` (varchar 30): código visible y libre (alfanumérico) que define cada
 *    empresa, único por empresa (ruc, codigo). `codarticulo` sigue siendo el ID interno
 *    (entero, PK global) que usan las FKs (inventario, listas de precios, almacén, ventas),
 *    así que no se toca. Backfill: codigo = codarticulo para los artículos existentes.
 *
 * 2. `familia` pasa de PK global (codfamilia) a PK por empresa (ruc, codfamilia): cada empresa
 *    numera sus familias desde 001 y no consume códigos de las demás (con PK global solo
 *    cabían 999 familias para TODAS las empresas).
 *
 * 3. Normaliza familias creadas con códigos libres ("1", "2", "A1"...). El módulo de
 *    artículos solo reconoce familia = 3 dígitos y subfamilia = 6 dígitos (familia + sub),
 *    así que esas familias no aparecían al crear artículos. Se reasignan al formato correcto
 *    y se actualizan las referencias en `articulos`.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if (Schema::hasTable('articulos') && ! Schema::hasColumn('articulos', 'codigo')) {
            Schema::table('articulos', function (Blueprint $table) {
                $table->string('codigo', 30)->nullable();
            });

            $cast = in_array($driver, ['mysql', 'mariadb'], true) ? 'CHAR(30)' : 'VARCHAR(30)';
            DB::table('articulos')->whereNull('codigo')
                ->update(['codigo' => DB::raw("CAST(codarticulo AS {$cast})")]);

            Schema::table('articulos', function (Blueprint $table) {
                $table->unique(['ruc', 'codigo'], 'articulos_ruc_codigo_unique');
            });
        }

        // El ID interno ahora lo genera siempre la BD: alinear la secuencia con los datos.
        if ($driver === 'pgsql' && Schema::hasTable('articulos')) {
            DB::statement("SELECT setval(pg_get_serial_sequence('articulos', 'codarticulo'), COALESCE((SELECT MAX(codarticulo) FROM articulos), 0) + 1, false)");
        }

        if (Schema::hasTable('familia')) {
            $this->familiaPorEmpresa($driver);
            $this->normalizarCodigosFamilia();
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('articulos') && Schema::hasColumn('articulos', 'codigo')) {
            Schema::table('articulos', function (Blueprint $table) {
                $table->dropUnique('articulos_ruc_codigo_unique');
                $table->dropColumn('codigo');
            });
        }
        // La PK por empresa y la normalización de códigos de familia no se revierten:
        // volver a la PK global fallaría en cuanto dos empresas compartan un código.
    }

    private function familiaPorEmpresa(string $driver): void
    {
        if ($driver === 'pgsql') {
            $pk = DB::selectOne("
                SELECT string_agg(a.attname, ',' ORDER BY a.attname) AS cols
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = 'familia'::regclass AND i.indisprimary
            ");
            if (($pk->cols ?? null) !== 'codfamilia,ruc') {
                DB::statement('ALTER TABLE familia DROP CONSTRAINT IF EXISTS familia_pkey');
                DB::statement('ALTER TABLE familia ADD CONSTRAINT familia_pkey PRIMARY KEY (ruc, codfamilia)');
            }

            return;
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $cols = collect(DB::select("SHOW INDEX FROM familia WHERE Key_name = 'PRIMARY'"))
                ->pluck('Column_name')->sort()->values()->all();
            if ($cols !== ['codfamilia', 'ruc']) {
                DB::statement('ALTER TABLE familia DROP PRIMARY KEY, ADD PRIMARY KEY (ruc, codfamilia)');
            }
        }
    }

    private function normalizarCodigosFamilia(): void
    {
        $irregulares = DB::table('familia')
            ->get()
            ->filter(fn ($f) => ! preg_match('/^\d{3}(\d{3})?$/', (string) $f->codfamilia))
            ->sortBy(fn ($f) => [$f->ruc, str_pad((string) $f->codfamilia, 6, '0', STR_PAD_LEFT)]);

        foreach ($irregulares as $fila) {
            DB::transaction(function () use ($fila) {
                $ruc = $fila->ruc;
                $nombreFamilia = trim((string) $fila->familia) !== '' ? trim($fila->familia) : 'SIN FAMILIA';
                $nombreSub = trim((string) $fila->subfamilia);
                $estado = (int) ($fila->estado ?? 1);

                $padre = DB::table('familia')
                    ->where('ruc', $ruc)
                    ->whereRaw('LENGTH(codfamilia) = 3')
                    ->whereRaw('LOWER(TRIM(familia)) = ?', [mb_strtolower($nombreFamilia)])
                    ->get()
                    ->first(fn ($f) => ctype_digit((string) $f->codfamilia));

                if (! $padre) {
                    $codPadre = $this->siguienteCodigo($ruc, null);
                    DB::table('familia')->insert([
                        'codfamilia' => $codPadre,
                        'ruc' => $ruc,
                        'familia' => $nombreFamilia,
                        'subfamilia' => null,
                        'estado' => $estado,
                    ]);
                } else {
                    $codPadre = $padre->codfamilia;
                    if ($estado === 1 && (int) $padre->estado !== 1) {
                        DB::table('familia')->where('ruc', $ruc)->where('codfamilia', $codPadre)->update(['estado' => 1]);
                    }
                }

                $codSub = null;
                if ($nombreSub !== '' && mb_strtolower($nombreSub) !== mb_strtolower($nombreFamilia)) {
                    $existente = DB::table('familia')
                        ->where('ruc', $ruc)
                        ->where('codfamilia', 'like', $codPadre.'%')
                        ->whereRaw('LENGTH(codfamilia) = 6')
                        ->whereRaw('LOWER(TRIM(subfamilia)) = ?', [mb_strtolower($nombreSub)])
                        ->first();

                    if ($existente) {
                        $codSub = substr($existente->codfamilia, 3, 3);
                    } else {
                        $codCompleto = $this->siguienteCodigo($ruc, $codPadre);
                        DB::table('familia')->insert([
                            'codfamilia' => $codCompleto,
                            'ruc' => $ruc,
                            'familia' => $nombreFamilia,
                            'subfamilia' => $nombreSub,
                            'estado' => $estado,
                        ]);
                        $codSub = substr($codCompleto, 3, 3);
                    }
                }

                DB::table('familia')->where('ruc', $ruc)->where('codfamilia', $fila->codfamilia)->delete();

                if (Schema::hasTable('articulos')) {
                    DB::table('articulos')
                        ->where('ruc', $ruc)
                        ->where('codfamilia', $fila->codfamilia)
                        ->update(['codfamilia' => $codPadre, 'codsubfamilia' => $codSub]);
                }
            });
        }
    }

    /** Siguiente código libre: familia "NNN" o, con $padre, subfamilia "PPPNNN". */
    private function siguienteCodigo(string $ruc, ?string $padre): string
    {
        $largo = $padre ? 6 : 3;
        $max = DB::table('familia')
            ->where('ruc', $ruc)
            ->when($padre, fn ($q) => $q->where('codfamilia', 'like', $padre.'%'))
            ->pluck('codfamilia')
            ->filter(fn ($c) => strlen((string) $c) === $largo && ctype_digit((string) $c))
            ->map(fn ($c) => (int) substr($c, -3))
            ->max() ?? 0;

        return ($padre ?? '').str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
    }
};
