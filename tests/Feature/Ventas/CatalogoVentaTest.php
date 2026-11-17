<?php

namespace Tests\Feature\Ventas;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreaEsquemaNegocio;
use Tests\TestCase;

/** Datos del formulario "Crear venta": catálogo con precios/stock y configuración. */
class CatalogoVentaTest extends TestCase
{
    use CreaEsquemaNegocio;
    use RefreshDatabase;

    private const RUC = '20100070970';
    private const OTRO_RUC = '20117332714';

    private $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->crearEsquemaNegocio();
        [, $this->user] = $this->empresaConUsuario(self::RUC);
    }

    // ---------- Catálogo y configuración ----------

    public function test_catalogo_trae_precio_de_la_lista_por_unidad_y_stock_del_almacen(): void
    {
        $almacen = $this->crearAlmacen(self::RUC);
        $lista = DB::table('lista_precios')->insertGetId(['ruc' => self::RUC, 'nombre' => 'principal', 'estado' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $azucar = $this->crearArticulo(self::RUC, ['codigo' => 'AZU', 'nombrearticulo' => 'Azúcar', 'codunidad' => 2]);
        $sinPrecio = $this->crearArticulo(self::RUC, ['codigo' => 'SAL', 'nombrearticulo' => 'Sal']);
        $this->crearArticulo(self::OTRO_RUC, ['codigo' => 'AJENO']);
        DB::table('preciosunidadm')->insert([
            ['codarticulo' => $azucar, 'codunidad' => 1, 'lista_precios_id' => $lista, 'pordefecto' => 1, 'preciopublico' => 99],
            ['codarticulo' => $azucar, 'codunidad' => 2, 'lista_precios_id' => $lista, 'pordefecto' => 0, 'preciopublico' => 4.2],
        ]);
        $this->ponerStock(self::RUC, $almacen, $azucar, 12.5);

        $res = $this->actingAs($this->user)->getJson("/api/ventas/catalogo?lista_precios_id={$lista}&almacen_id={$almacen}")
            ->assertOk()
            ->assertJsonCount(2);

        $porCodigo = collect($res->json())->keyBy('codigo');
        $this->assertEquals(4.2, $porCodigo['AZU']['precio']);   // precio de SU unidad (KGM), no el por defecto
        $this->assertSame('KGM', $porCodigo['AZU']['unidad']);
        $this->assertEquals(12.5, $porCodigo['AZU']['stock']);
        $this->assertNull($porCodigo['SAL']['precio']);
        $this->assertEquals(0, $porCodigo['SAL']['stock']);
        $this->assertArrayNotHasKey('AJENO', $porCodigo->all());
        $this->assertNotNull($sinPrecio);
    }

    public function test_configuracion_trae_fecha_de_hoy_y_tipos_factura_boleta_ticket(): void
    {
        $this->crearAlmacen(self::RUC, 'Tienda');
        $this->crearAlmacen(self::OTRO_RUC, 'Ajeno');

        $this->actingAs($this->user)->getJson('/api/ventas/configuracion')
            ->assertOk()
            ->assertJsonPath('fecha', now()->format('Y-m-d'))
            ->assertJsonPath('tipos.2.nombre', 'Ticket')
            ->assertJsonCount(1, 'almacenes')
            ->assertJsonPath('almacenes.0.nombre', 'Tienda');
    }
}
