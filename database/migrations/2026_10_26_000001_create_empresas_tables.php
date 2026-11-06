<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('empresas')) {
            Schema::create('empresas', function (Blueprint $table) {
                $table->id();
                $table->string('ruc', 11)->unique();
                $table->string('razon_social', 200);
                $table->string('nombre_comercial', 200)->nullable();
                $table->string('direccion', 200)->nullable();
                $table->string('telefono', 20)->nullable();
                $table->string('email', 150)->nullable();
                $table->boolean('estado')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('empresa_user')) {
            Schema::create('empresa_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('rol', 20)->default('operador');
                $table->boolean('activo')->default(true);
                $table->timestamps();

                $table->unique(['empresa_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('empresa_user');
        Schema::dropIfExists('empresas');
    }
};
