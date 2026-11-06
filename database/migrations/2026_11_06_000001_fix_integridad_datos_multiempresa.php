<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Correcciones de datos detectadas al probar contra la base de producción (PostgreSQL):
 *
 * 1. `operacion` solo tenía "Compra" (id 1). VentasController registra el documento de almacén
 *    con operacion_id = 2 ("Venta"), así que toda venta fallaba por FK (fk_wd_operacion).
 * 2. Secuencias de identidad desfasadas tras la carga MySQL -> Postgres (p. ej. users.id):
 *    crear un usuario fallaba con "llave duplicada users_pkey".
 * 3. `proveedores.ruc` era UNIQUE global: dos empresas no podían registrar al mismo proveedor.
 *    Pasa a ser único por empresa (user_ruc, ruc) entre proveedores activos.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if (Schema::hasTable('operacion') && ! DB::table('operacion')->where('id', 2)->exists()) {
            DB::table('operacion')->insert([
                'id' => 2,
                'descripcion' => 'Venta',
                'tipo_movimiento' => 'SALIDA',
                'cod_sunat' => '01',
                'estado' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if ($driver === 'pgsql') {
            $this->resincronizarSecuencias();
        }

        if (Schema::hasTable('proveedores')) {
            $this->proveedorUnicoPorEmpresa($driver);
        }
    }

    public function down(): void
    {
        // Correcciones de datos: no se revierten.
    }

    private function resincronizarSecuencias(): void
    {
        $columnas = DB::select("
            SELECT c.table_name, c.column_name,
                   pg_get_serial_sequence(format('%I', c.table_name), c.column_name) AS seq
            FROM information_schema.columns c
            WHERE c.table_schema = current_schema()
              AND (c.is_identity = 'YES' OR c.column_default LIKE 'nextval%')
        ");

        foreach ($columnas as $col) {
            if (! $col->seq) {
                continue;
            }
            $tabla = '"'.str_replace('"', '""', $col->table_name).'"';
            $campo = '"'.str_replace('"', '""', $col->column_name).'"';
            DB::statement("SELECT setval(?, COALESCE((SELECT MAX({$campo}) FROM {$tabla}), 0) + 1, false)", [$col->seq]);
        }
    }

    private function proveedorUnicoPorEmpresa(string $driver): void
    {
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE proveedores DROP CONSTRAINT IF EXISTS proveedores_ruc_key');
            DB::statement('DROP INDEX IF EXISTS proveedores_ruc_key');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS proveedores_empresa_ruc_activo_unique ON proveedores (user_ruc, ruc) WHERE estado = 1');

            return;
        }

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $indices = collect(DB::select("SHOW INDEX FROM proveedores WHERE Non_unique = 0 AND Column_name = 'ruc'"))
                ->pluck('Key_name')->unique()->reject(fn ($k) => $k === 'PRIMARY');

            foreach ($indices as $indice) {
                $columnas = collect(DB::select('SHOW INDEX FROM proveedores WHERE Key_name = ?', [$indice]));
                if ($columnas->count() === 1) {
                    DB::statement("ALTER TABLE proveedores DROP INDEX `{$indice}`");
                }
            }

            $existe = collect(DB::select("SHOW INDEX FROM proveedores WHERE Key_name = 'proveedores_empresa_ruc_unique'"))->isNotEmpty();
            if (! $existe) {
                DB::statement('ALTER TABLE proveedores ADD UNIQUE KEY proveedores_empresa_ruc_unique (user_ruc, ruc)');
            }
        }
    }
};
