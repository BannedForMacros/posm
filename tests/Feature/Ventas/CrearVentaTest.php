<?php

namespace Tests\Feature\Ventas;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreaEsquemaNegocio;
use Tests\TestCase;

class CrearVentaTest extends TestCase
{
    use CreaEsquemaNegocio;
    use RefreshDatabase;

    private const RUC = '20100070970';
    private const OTRO_RUC = '20117332714';

    private $user;
    private int $almacen;
    private int $arroz;
    private int $azucar;

    protected function setUp(): void
    {
        parent::setUp();
        $this->crearEsquemaNegocio();

        [, $this->user] = $this->empresaConUsuario(self::RUC);
        $this->almacen = $this->crearAlmacen(self::RUC);
        $this->arroz = $this->crearArticulo(self::RUC, ['codigo' => 'ARR-750', 'nombrearticulo' => 'Arroz 750 g']);
        $this->azucar = $this->crearArticulo(self::RUC, ['codigo' => 'AZU-1K', 'nombrearticulo' => 'Azúcar 1 kg', 'codunidad' => 2]);
        $this->ponerStock(self::RUC, $this->almacen, $this->arroz, 10);
        $this->ponerStock(self::RUC, $this->almacen, $this->azucar, 5);
        $this->crearSerie(self::RUC, '03', 'B001');
        $this->crearSerie(self::RUC, '01', 'F001');
        $this->crearSerie(self::RUC, '12', 'T001');
    }

    private function venta(array $cambios = []): array
    {
        return array_replace_recursive([
            'cod_documento' => '03',
            'seri_venta' => 'B001',
            'almacen_id' => $this->almacen,
            'cliente_documento' => '',
            'cliente_nombre' => '',
            'detalles' => [
                ['cod_articulo' => $this->arroz, 'cantidad' => 2, 'precio_unitario' => 4.5],
            ],
        ], $cambios);
    }

    private function postVenta(array $datos)
    {
        return $this->actingAs($this->user)->postJson('/api/ventas', $datos);
    }

    public function test_registra_boleta_con_correlativo_automatico_fecha_de_hoy_y_descuenta_stock(): void
    {
        Carbon::setTestNow('2026-11-17 10:30:00');
        // Ventas previas de la serie (POS de escritorio): el siguiente debe ser 100.
        DB::table('ventas')->insert([
            ['COD_DOCUMENTO' => '03', 'SERI_VENTA' => 'B001', 'NUME_VENTA' => '99', 'RUCEMPRESA' => self::RUC],
            ['COD_DOCUMENTO' => '03', 'SERI_VENTA' => 'B001', 'NUME_VENTA' => '7', 'RUCEMPRESA' => self::RUC],
            // Otra empresa con la misma serie no influye.
            ['COD_DOCUMENTO' => '03', 'SERI_VENTA' => 'B001', 'NUME_VENTA' => '500', 'RUCEMPRESA' => self::OTRO_RUC],
        ]);

        $this->postVenta($this->venta([
            'fecha' => '2020-01-01',     // se ignora: la fecha no es editable
            'nume_venta' => '12345',     // se ignora: el correlativo es automático
        ]))
            ->assertCreated()
            ->assertJsonPath('venta.nume_venta', '100')
            ->assertJsonPath('venta.total_venta', 9);

        $this->assertDatabaseHas('ventas', [
            'COD_DOCUMENTO' => '03', 'SERI_VENTA' => 'B001', 'NUME_VENTA' => '100', 'RUCEMPRESA' => self::RUC,
            'FEMI_VENTA' => '2026-11-17', 'RAZONSOCIALCLI' => 'CLIENTES VARIOS', 'NUMEROITEMS' => '1',
        ]);
        $this->assertDatabaseHas('ventasdetalle', [
            'NUME_VENTA' => '100', 'COD_ARTICULO' => (string) $this->arroz, 'CODIGOARTINTERNO' => 'ARR-750',
            'UNIDADMEDIDA' => 'NIU', 'COD_UNIDADM' => '1',
        ]);
        $this->assertEquals(8, DB::table('inventario')->where('cod_articulo', $this->arroz)->value('stock'));
        $this->assertDatabaseHas('warehouse_document', ['ruc' => self::RUC, 'operacion_id' => 2, 'tipo_movimiento' => 'SALIDA']);
    }

    public function test_correlativos_independientes_por_serie_y_consecutivos(): void
    {
        $this->postVenta($this->venta())->assertJsonPath('venta.nume_venta', '1');
        $this->postVenta($this->venta())->assertJsonPath('venta.nume_venta', '2');
        $this->postVenta($this->venta(['cod_documento' => '12', 'seri_venta' => 'T001']))
            ->assertCreated()
            ->assertJsonPath('venta.nume_venta', '1');
    }

    public function test_usa_la_unidad_de_medida_del_articulo(): void
    {
        $this->postVenta($this->venta(['detalles' => [['cod_articulo' => $this->azucar, 'cantidad' => 1.5, 'precio_unitario' => 4]]]))
            ->assertCreated();

        $this->assertDatabaseHas('ventasdetalle', ['COD_ARTICULO' => (string) $this->azucar, 'COD_UNIDADM' => '2', 'UNIDADMEDIDA' => 'KGM']);
    }

    public function test_rechaza_cantidad_y_precio_negativos_o_cero(): void
    {
        $this->postVenta($this->venta(['detalles' => [['cod_articulo' => $this->arroz, 'cantidad' => -1, 'precio_unitario' => -5]]]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['detalles.0.cantidad', 'detalles.0.precio_unitario']);

        $this->postVenta($this->venta(['detalles' => [['cod_articulo' => $this->arroz, 'cantidad' => 0, 'precio_unitario' => 1]]]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['detalles.0.cantidad']);

        $this->assertSame(0, DB::table('ventas')->count());
    }

    public function test_serie_inexistente_o_de_otro_tipo_se_rechaza(): void
    {
        $this->crearSerie(self::OTRO_RUC, '03', 'B777');

        $this->postVenta($this->venta(['seri_venta' => 'B777']))->assertJsonValidationErrors(['seri_venta']);
        $this->postVenta($this->venta(['seri_venta' => 'F001']))->assertJsonValidationErrors(['seri_venta']);
        $this->postVenta($this->venta(['cod_documento' => 'XX']))->assertJsonValidationErrors(['cod_documento']);
    }

    public function test_factura_exige_ruc_valido_y_razon_social(): void
    {
        $factura = ['cod_documento' => '01', 'seri_venta' => 'F001'];

        $this->postVenta($this->venta($factura))->assertJsonValidationErrors(['cliente_documento']);
        $this->postVenta($this->venta($factura + ['cliente_documento' => '46779354', 'cliente_nombre' => 'X']))
            ->assertJsonValidationErrors(['cliente_documento']);
        $this->postVenta($this->venta($factura + ['cliente_documento' => '20100070971', 'cliente_nombre' => 'X']))
            ->assertJsonValidationErrors(['cliente_documento']);
        $this->postVenta($this->venta($factura + ['cliente_documento' => '20100070970']))
            ->assertJsonValidationErrors(['cliente_nombre']);

        $this->postVenta($this->venta($factura + [
            'cliente_documento' => '20100070970', 'cliente_nombre' => 'Mi Cliente SAC', 'cliente_direccion' => 'Av. Lima 123',
        ]))->assertCreated();

        $this->assertDatabaseHas('ventas', ['COD_DOCUMENTO' => '01', 'TIPODOCUMENTOCLI' => 'RUC', 'RAZONSOCIALCLI' => 'MI CLIENTE SAC']);
    }

    public function test_guarda_el_cliente_y_lo_actualiza_en_la_siguiente_venta(): void
    {
        $this->postVenta($this->venta(['cliente_documento' => '46779354', 'cliente_nombre' => 'Juan Pérez']))->assertCreated();
        $this->postVenta($this->venta(['cliente_documento' => '46779354', 'cliente_nombre' => 'Juan Pérez Ríos', 'cliente_direccion' => 'Jr. Unión 1']))
            ->assertCreated();

        $this->assertSame(1, DB::table('clientes')->where('numero_documento', '46779354')->count());
        $cliente = DB::table('clientes')->where('numero_documento', '46779354')->first();
        $this->assertSame('JUAN PÉREZ RÍOS', $cliente->razon_social);
        $this->assertSame('Jr. Unión 1', $cliente->direccion);
        $this->assertSame(self::RUC, $cliente->ruc_empresa);
        $this->assertEquals($cliente->id, DB::table('ventas')->where('NUME_VENTA', '2')->value('ID_CLIENTE'));
    }

    public function test_boleta_desde_700_soles_exige_documento_del_cliente(): void
    {
        $this->ponerStock(self::RUC, $this->almacen, $this->azucar, 1000);
        $grande = ['detalles' => [['cod_articulo' => $this->azucar, 'cantidad' => 200, 'precio_unitario' => 3.5]]];

        $this->postVenta($this->venta($grande))->assertJsonValidationErrors(['cliente_documento']);
        $this->postVenta($this->venta($grande + ['cliente_documento' => '46779354', 'cliente_nombre' => 'Ana']))->assertCreated();
    }

    public function test_stock_insuficiente_sumando_lineas_repetidas_no_registra_nada(): void
    {
        $this->postVenta($this->venta(['detalles' => [
            ['cod_articulo' => $this->arroz, 'cantidad' => 6, 'precio_unitario' => 4],
            ['cod_articulo' => $this->arroz, 'cantidad' => 6, 'precio_unitario' => 4],
        ]]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['detalles']);

        $this->assertSame(0, DB::table('ventas')->count());
        $this->assertEquals(10, DB::table('inventario')->where('cod_articulo', $this->arroz)->value('stock'));
    }

    public function test_no_se_pueden_vender_articulos_ni_usar_almacenes_de_otra_empresa(): void
    {
        $ajeno = $this->crearArticulo(self::OTRO_RUC, ['codigo' => 'X1']);
        $almacenAjeno = $this->crearAlmacen(self::OTRO_RUC, 'Ajeno');

        $this->postVenta($this->venta(['detalles' => [['cod_articulo' => $ajeno, 'cantidad' => 1, 'precio_unitario' => 1]]]))
            ->assertJsonValidationErrors(['detalles.0.cod_articulo']);
        $this->postVenta($this->venta(['almacen_id' => $almacenAjeno]))
            ->assertJsonValidationErrors(['almacen_id']);
    }
}
