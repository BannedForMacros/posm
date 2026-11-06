<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Backfill de empresas/membresías y repunte de FKs del tenant (MySQL/MariaDB y PostgreSQL).
 *
 * Las tablas de negocio fueron creadas con FK hacia `users.ruc`. Eso impide
 * que varias personas pertenezcan a la misma empresa y que el superadmin cree
 * empresas sin un usuario "dueño". Aquí se reemplazan esas FK por FK hacia
 * `empresas.ruc`, que pasa a ser la clave real del tenant.
 *
 * En otros motores (p. ej. SQLite de los tests) no hace nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! $this->soportado()) {
            return;
        }

        $this->seedEmpresasFrom('users', 'ruc', 'name');
        $this->seedEmpresasFrom('articulos', 'ruc');
        $this->seedEmpresasFrom('familia', 'ruc');
        $this->seedEmpresasFrom('lista_precios', 'ruc');
        $this->seedEmpresasFrom('inventario', 'ruc');
        $this->seedEmpresasFrom('inventario_inicial', 'ruc');
        $this->seedEmpresasFrom('proveedores', 'user_ruc');
        $this->seedEmpresasFrom('sucursal', 'user_ruc');
        $this->seedEmpresasFrom('warehouse_document', 'ruc');
        $this->seedEmpresasFrom('ventas', 'RUCEMPRESA');

        $this->seedMembershipsFromUsers();

        $this->repointForeignKey('inventario', 'ruc', 'fk_inventario_empresa_ruc');
        $this->repointForeignKey('inventario_inicial', 'ruc', 'fk_inventario_inicial_empresa_ruc');
        $this->repointForeignKey('proveedores', 'user_ruc', 'fk_proveedores_empresa_ruc');
        $this->repointForeignKey('sucursal', 'user_ruc', 'fk_sucursal_empresa_ruc');
        $this->repointForeignKey('warehouse_document', 'ruc', 'fk_warehouse_document_empresa_ruc');
    }

    public function down(): void
    {
        if (! $this->soportado()) {
            return;
        }

        $this->repointForeignKey('inventario', 'ruc', 'fk_inv_users_ruc_unico', 'users');
        $this->repointForeignKey('inventario_inicial', 'ruc', 'fk_inventario_users_ruc', 'users');
        $this->repointForeignKey('proveedores', 'user_ruc', 'fk_proveedores_users_ruc', 'users');
        $this->repointForeignKey('sucursal', 'user_ruc', 'fk_sucursal_users_ruc', 'users');
        $this->repointForeignKey('warehouse_document', 'ruc', 'fk_warehouse_document_users_ruc', 'users');
    }

    private function soportado(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb', 'pgsql'], true);
    }

    private function esPostgres(): bool
    {
        return DB::getDriverName() === 'pgsql';
    }

    /** Cita un identificador según el motor (respeta mayúsculas en Postgres). */
    private function q(string $identifier): string
    {
        return $this->esPostgres() ? '"'.$identifier.'"' : '`'.$identifier.'`';
    }

    /** Nombre real de la columna (en Postgres puede estar en MAYÚSCULAS). */
    private function columnaReal(string $table, string $column): ?string
    {
        foreach (Schema::getColumnListing($table) as $real) {
            if (strcasecmp($real, $column) === 0) {
                return $real;
            }
        }

        return null;
    }

    private function seedEmpresasFrom(string $table, string $column, ?string $nameColumn = null): void
    {
        if (! Schema::hasTable($table) || ! ($column = $this->columnaReal($table, $column))) {
            return;
        }

        $col = $this->q($column);
        $source = $nameColumn && ($nameColumn = $this->columnaReal($table, $nameColumn))
            ? "COALESCE(NULLIF({$this->q($nameColumn)}, ''), {$col})"
            : $col;

        // Una sola fila por RUC (en MySQL DISTINCT por ruc+nombre podía duplicar el RUC).
        $select = "
            SELECT {$col} AS ruc, MAX({$source}) AS razon_social
            FROM {$this->q($table)}
            WHERE {$col} IS NOT NULL AND {$col} <> ''
            GROUP BY {$col}
        ";

        if ($this->esPostgres()) {
            DB::statement("
                INSERT INTO empresas (ruc, razon_social, estado, created_at, updated_at)
                SELECT s.ruc, s.razon_social, TRUE, NOW(), NOW() FROM ({$select}) s
                ON CONFLICT (ruc) DO NOTHING
            ");
        } else {
            DB::statement("
                INSERT IGNORE INTO empresas (ruc, razon_social, estado, created_at, updated_at)
                SELECT s.ruc, s.razon_social, TRUE, NOW(), NOW() FROM ({$select}) s
            ");
        }
    }

    private function seedMembershipsFromUsers(): void
    {
        $select = "
            SELECT e.id, u.id, 'admin', TRUE, NOW(), NOW()
            FROM users u
            INNER JOIN empresas e ON e.ruc = u.ruc
            WHERE u.ruc IS NOT NULL AND u.ruc <> ''
        ";

        if ($this->esPostgres()) {
            DB::statement("
                INSERT INTO empresa_user (empresa_id, user_id, rol, activo, created_at, updated_at)
                {$select}
                ON CONFLICT (empresa_id, user_id) DO NOTHING
            ");
        } else {
            DB::statement("
                INSERT IGNORE INTO empresa_user (empresa_id, user_id, rol, activo, created_at, updated_at)
                {$select}
            ");
        }
    }

    private function repointForeignKey(
        string $table,
        string $column,
        string $newConstraint,
        string $targetTable = 'empresas',
        string $targetColumn = 'ruc'
    ): void {
        if (! Schema::hasTable($table) || ! ($column = $this->columnaReal($table, $column))) {
            return;
        }

        // Se eliminan todas las FK existentes sobre la columna (los nombres
        // reales pueden variar entre instalaciones), excepto la nueva.
        foreach ($this->foreignKeysOn($table, $column) as $constraint) {
            if ($constraint !== $newConstraint) {
                DB::statement($this->esPostgres()
                    ? "ALTER TABLE {$this->q($table)} DROP CONSTRAINT {$this->q($constraint)}"
                    : "ALTER TABLE {$this->q($table)} DROP FOREIGN KEY {$this->q($constraint)}");
            }
        }

        if (! $this->foreignKeyExists($table, $newConstraint)) {
            DB::statement("
                ALTER TABLE {$this->q($table)}
                ADD CONSTRAINT {$this->q($newConstraint)}
                FOREIGN KEY ({$this->q($column)}) REFERENCES {$this->q($targetTable)} ({$this->q($targetColumn)})
                ON UPDATE CASCADE ON DELETE RESTRICT
            ");
        }
    }

    /**
     * @return array<int, string>
     */
    private function foreignKeysOn(string $table, string $column): array
    {
        if ($this->esPostgres()) {
            return collect(DB::select("
                SELECT c.conname
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
                WHERE c.contype = 'f'
                  AND c.conrelid = to_regclass(?)
                  AND a.attname = ?
                  AND array_length(c.conkey, 1) = 1
            ", [$this->q($table), $column]))->pluck('conname')->unique()->values()->all();
        }

        return DB::table('information_schema.KEY_COLUMN_USAGE')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', $table)
            ->where('COLUMN_NAME', $column)
            ->whereNotNull('REFERENCED_TABLE_NAME')
            ->pluck('CONSTRAINT_NAME')
            ->unique()
            ->values()
            ->all();
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        if ($this->esPostgres()) {
            return DB::table('pg_constraint')
                ->where('contype', 'f')
                ->where('conname', $constraint)
                ->whereRaw('conrelid = to_regclass(?)', [$this->q($table)])
                ->exists();
        }

        return DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', $table)
            ->where('CONSTRAINT_NAME', $constraint)
            ->where('CONSTRAINT_TYPE', 'FOREIGN KEY')
            ->exists();
    }
};
