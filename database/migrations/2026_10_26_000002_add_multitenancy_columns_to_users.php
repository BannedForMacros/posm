<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'is_superadmin')) {
                $table->boolean('is_superadmin')->default(false)->after('ruc');
            }

            if (! Schema::hasColumn('users', 'activo')) {
                $table->boolean('activo')->default(true)->after('is_superadmin');
            }
        });

        if (Schema::hasColumn('users', 'ruc')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('ruc', 11)->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'activo')) {
                $table->dropColumn('activo');
            }

            if (Schema::hasColumn('users', 'is_superadmin')) {
                $table->dropColumn('is_superadmin');
            }
        });
    }
};
