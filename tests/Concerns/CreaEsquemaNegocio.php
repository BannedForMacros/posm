<?php

namespace Tests\Concerns;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Las tablas de negocio no viven en migraciones (se crean con scripts SQL en producción).
 * Para los tests se recrean en SQLite con las columnas que usa el código.
 */
trait CreaEsquemaNegocio
{
    protected function crearEsquemaNegocio(): void
    {
        Schema::create('unidadmedida', function (Blueprint $t) {
            $t->increments('codunidad');
            $t->string('unidad', 100)->nullable();
            $t->decimal('cantidad', 12, 4)->nullable();
            $t->string('siglasunat', 10)->nullable();
            $t->string('fecha', 10)->nullable();
            $t->string('usuario', 30)->nullable();
            $t->string('siglaunidadDMK', 10)->nullable();
        });
        DB::table('unidadmedida')->insert([
            ['codunidad' => 1, 'unidad' => 'unidad', 'cantidad' => 1, 'siglasunat' => 'NIU'],
            ['codunidad' => 2, 'unidad' => 'kilogramo', 'cantidad' => 1, 'siglasunat' => 'KGM'],
        ]);

        Schema::create('familia', function (Blueprint $t) {
            $t->string('codfamilia', 6);
            $t->string('ruc', 11);
            $t->string('familia', 200)->nullable();
            $t->string('subfamilia', 200)->nullable();
            $t->integer('estado')->nullable();
            $t->primary(['ruc', 'codfamilia']);
        });

        Schema::create('articulos', function (Blueprint $t) {
            $t->increments('codarticulo');
            $t->string('codigo', 30)->nullable();
            $t->string('codfamilia', 6)->nullable();
            $t->string('ruc', 11);
            $t->string('codsubfamilia', 6)->nullable();
            $t->string('nombrearticulo', 200)->nullable();
            $t->string('nombrecorto', 50)->nullable();
            $t->decimal('stockminimo', 12, 4)->nullable();
            $t->decimal('stockmaximo', 12, 4)->nullable();
            $t->integer('tipoigv')->nullable();
            $t->string('codbarra', 100)->nullable();
            $t->string('foto', 100)->nullable();
            $t->string('codigosunat', 10)->nullable();
            $t->integer('icbper')->nullable();
            $t->decimal('montoicbper', 12, 2)->nullable();
            $t->integer('controlpeso')->nullable();
            $t->string('codartnue', 50)->nullable();
            $t->integer('codunidad')->nullable()->default(1);
            $t->integer('estado')->nullable();
            $t->unique(['ruc', 'codigo']);
        });

        Schema::create('almacen', function (Blueprint $t) {
            $t->id();
            $t->string('nombre', 100);
            $t->string('ubicacion', 200)->nullable();
            $t->smallInteger('estado')->default(1);
            $t->timestamps();
        });

        if (! Schema::hasTable('sucursal')) {
            Schema::create('sucursal', function (Blueprint $t) {
                $t->id();
                $t->string('user_ruc', 11)->nullable();
                $t->string('nombre', 100);
                $t->string('direccion', 200)->nullable();
                $t->smallInteger('estado')->default(1);
                $t->unsignedBigInteger('empresa_id')->nullable();
                $t->timestamps();
            });
        }

        Schema::create('sucursal_almacen', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('sucursal_id');
            $t->unsignedBigInteger('almacen_id');
            $t->smallInteger('estado')->default(1);
            $t->timestamps();
        });

        Schema::create('inventario', function (Blueprint $t) {
            $t->id();
            $t->string('ruc', 11);
            $t->unsignedBigInteger('almacen_id');
            $t->integer('cod_articulo');
            $t->decimal('stock', 14, 4)->default(0);
            $t->timestamps();
        });

        Schema::create('lista_precios', function (Blueprint $t) {
            $t->id();
            $t->string('ruc', 11);
            $t->string('nombre', 100);
            $t->smallInteger('estado')->default(1);
            $t->timestamps();
        });

        Schema::create('preciosunidadm', function (Blueprint $t) {
            $t->integer('codarticulo');
            $t->integer('codunidad');
            $t->unsignedBigInteger('lista_precios_id');
            $t->integer('pordefecto')->nullable();
            $t->decimal('preciopublico', 12, 2)->nullable();
            $t->timestamps();
        });

        Schema::create('ventas', function (Blueprint $t) {
            $t->char('COD_DOCUMENTO', 2);
            $t->string('SERI_VENTA', 20);
            $t->string('NUME_VENTA', 20);
            $t->string('RUCEMPRESA', 11);
            $t->integer('ID_CLIENTE')->nullable();
            foreach (['FEMI_VENTA', 'HORAEMISION', 'CREA_USUARIO', 'TIPODOCUMENTOCLI', 'NUMERODOCUMENTOCLI',
                'RAZONSOCIALCLI', 'DIRECCIONCLI', 'CORREOCLI', 'NUMEROITEMS', 'CODALMACEN'] as $c) {
                $t->string($c, 150)->nullable();
            }
            foreach (['TNETO_VENTA', 'TDES_VENTA', 'IMPU_VENTA', 'TOTAL_VENTA', 'TCAMB_VENTA'] as $c) {
                $t->decimal($c, 14, 2)->nullable();
            }
            $t->integer('ESTA_VENTA')->nullable();
            $t->timestamp('fec_crea')->nullable();
            $t->primary(['COD_DOCUMENTO', 'SERI_VENTA', 'NUME_VENTA', 'RUCEMPRESA']);
        });

        Schema::create('ventasdetalle', function (Blueprint $t) {
            foreach (['COD_DOCUMENTO', 'SERI_VENTA', 'NUME_VENTA', 'COD_ARTICULO', 'CODIGOARTINTERNO', 'COD_UNIDADM',
                'UNIDADMEDIDA', 'ESTA_VENTASD', 'FEC_CREA', 'CREA_USUARIO'] as $c) {
                $t->string($c, 150)->nullable();
            }
            $t->integer('ID_VENTASD')->nullable();
            $t->integer('TIP_IGV')->nullable();
            foreach (['CANT_VENTASD', 'PUNI_VENTASD', 'IMPU_VENTASD', 'TNETO_VENTASD', 'TDESC_VENTASD', 'TIMP_VENTASD', 'TASA_IMP'] as $c) {
                $t->decimal($c, 14, 4)->nullable();
            }
        });

        Schema::create('warehouse_document', function (Blueprint $t) {
            $t->id();
            $t->string('ruc', 11);
            $t->unsignedBigInteger('almacen_id');
            $t->unsignedBigInteger('facturacion_id')->nullable();
            $t->unsignedBigInteger('venta_id')->nullable();
            $t->unsignedBigInteger('user_id')->nullable();
            $t->unsignedBigInteger('operacion_id');
            $t->string('tipo_movimiento', 20);
            $t->timestamp('fecha');
            $t->smallInteger('estado');
            $t->timestamps();
        });

        Schema::create('warehouse_document_detail', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('warehouse_document_id');
            $t->integer('cod_articulo');
            $t->decimal('cantidad', 14, 4);
            $t->decimal('precio_unitario', 14, 4);
            $t->decimal('costo', 14, 4)->default(0);
            $t->smallInteger('estado');
            $t->timestamps();
        });
    }

    /** Empresa + usuario admin de ella (su empresa activa). */
    protected function empresaConUsuario(string $ruc, string $nombre = 'Empresa Test'): array
    {
        $empresa = Empresa::create(['ruc' => $ruc, 'razon_social' => $nombre, 'estado' => true]);
        $user = User::factory()->create(['ruc' => $ruc]);
        $empresa->users()->attach($user->id, ['rol' => 'admin', 'activo' => true]);

        return [$empresa, $user];
    }

    /** Almacén asociado a una sucursal de la empresa. */
    protected function crearAlmacen(string $ruc, string $nombre = 'Principal'): int
    {
        $sucursalId = DB::table('sucursal')->insertGetId([
            'user_ruc' => $ruc, 'nombre' => "Sucursal {$nombre}", 'estado' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $almacenId = DB::table('almacen')->insertGetId(['nombre' => $nombre, 'estado' => 1, 'created_at' => now(), 'updated_at' => now()]);
        DB::table('sucursal_almacen')->insert([
            'sucursal_id' => $sucursalId, 'almacen_id' => $almacenId, 'estado' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return $almacenId;
    }

    protected function crearArticulo(string $ruc, array $datos = []): int
    {
        return DB::table('articulos')->insertGetId(array_merge([
            'ruc' => $ruc,
            'codigo' => 'A'.random_int(1000, 999999),
            'nombrearticulo' => 'Artículo de prueba',
            'codunidad' => 1,
            'estado' => 1,
        ], $datos), 'codarticulo');
    }

    protected function ponerStock(string $ruc, int $almacenId, int $codArticulo, float $stock): void
    {
        DB::table('inventario')->insert([
            'ruc' => $ruc, 'almacen_id' => $almacenId, 'cod_articulo' => $codArticulo, 'stock' => $stock,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    protected function crearSerie(string $ruc, string $cod, string $serie): void
    {
        DB::table('series_documento')->insert([
            'ruc' => $ruc, 'cod_documento' => $cod, 'serie' => $serie, 'estado' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
