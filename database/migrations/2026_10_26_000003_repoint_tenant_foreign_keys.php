<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migración específica de MySQL/MariaDB.
 *
 * Las tablas de negocio fueron creadas con FK hacia `users.ruc`. Eso impide
 * que varias personas pertenezcan a la misma empresa y que el superadmin cree
 * empresas sin un usuario "dueño". Aquí se reemplazan esas FK por FK hacia
 * `empresas.ruc`, que pasa a ser la clave real del tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
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
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $this->repointForeignKey('inventario', 'ruc', 'fk_inv_users_ruc_unico', 'users');
        $this->repointForeignKey('inventario_inicial', 'ruc', 'fk_inventario_users_ruc', 'users');
        $this->repointForeignKey('proveedores', 'user_ruc', 'fk_proveedores_users_ruc', 'users');
        $this->repointForeignKey('sucursal', 'user_ruc', 'fk_sucursal_users_ruc', 'users');
        $this->repointForeignKey('warehouse_document', 'ruc', 'fk_warehouse_document_users_ruc', 'users');
    }

    private function seedEmpresasFrom(string $table, string $column, ?string $nameColumn = null): void
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        $source = $nameColumn
            ? "COALESCE(NULLIF(`{$nameColumn}`, ''), `{$column}`)"
            : "`{$column}`";

        DB::statement("
            INSERT IGNORE INTO empresas (ruc, razon_social, estado, created_at, updated_at)
            SELECT DISTINCT `{$column}`, {$source}, 1, NOW(), NOW()
            FROM `{$table}`
            WHERE `{$column}` IS NOT NULL AND `{$column}` <> ''
        ");
    }

    private function seedMembershipsFromUsers(): void
    {
        DB::statement("
            INSERT IGNORE INTO empresa_user (empresa_id, user_id, rol, activo, created_at, updated_at)
            SELECT e.id, u.id, 'admin', 1, NOW(), NOW()
            FROM users u
            INNER JOIN empresas e ON e.ruc = u.ruc
            WHERE u.ruc IS NOT NULL AND u.ruc <> ''
        ");
    }

    private function repointForeignKey(
        string $table,
        string $column,
        string $newConstraint,
        string $targetTable = 'empresas',
        string $targetColumn = 'ruc'
    ): void {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        // Se eliminan todas las FK existentes sobre la columna (los nombres
        // reales pueden variar entre instalaciones), excepto la nueva.
        foreach ($this->foreignKeysOn($table, $column) as $constraint) {
            if ($constraint !== $newConstraint) {
                DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$constraint}`");
            }
        }

        if (! $this->foreignKeyExists($table, $newConstraint)) {
            DB::statement("
                ALTER TABLE `{$table}`
                ADD CONSTRAINT `{$newConstraint}`
                FOREIGN KEY (`{$column}`) REFERENCES `{$targetTable}` (`{$targetColumn}`)
                ON UPDATE CASCADE ON DELETE RESTRICT
            ");
        }
    }

    /**
     * @return array<int, string>
     */
    private function foreignKeysOn(string $table, string $column): array
    {
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
        return DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', $table)
            ->where('CONSTRAINT_NAME', $constraint)
            ->where('CONSTRAINT_TYPE', 'FOREIGN KEY')
            ->exists();
    }
};
