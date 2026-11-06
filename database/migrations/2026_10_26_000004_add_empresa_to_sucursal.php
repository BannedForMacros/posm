<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sucursal')) {
            Schema::create('sucursal', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
                $table->string('user_ruc', 11)->nullable();
                $table->string('nombre', 100);
                $table->string('direccion', 200)->nullable();
                $table->boolean('estado')->default(true);
                $table->timestamps();
            });

            return;
        }

        if (! Schema::hasColumn('sucursal', 'empresa_id')) {
            Schema::table('sucursal', function (Blueprint $table) {
                $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            });
        }

        // Completar la relación nueva a partir de la columna legada `user_ruc`.
        DB::table('sucursal')
            ->whereNull('empresa_id')
            ->update([
                'empresa_id' => DB::raw('(SELECT id FROM empresas WHERE empresas.ruc = sucursal.user_ruc)'),
            ]);

        DB::table('sucursal')
            ->whereNull('user_ruc')
            ->whereNotNull('empresa_id')
            ->update([
                'user_ruc' => DB::raw('(SELECT ruc FROM empresas WHERE empresas.id = sucursal.empresa_id)'),
            ]);
    }

    public function down(): void
    {
        // No se elimina `empresa_id` para no perder la relación de los locales.
    }
};
