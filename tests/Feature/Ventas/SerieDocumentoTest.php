<?php

namespace Tests\Feature\Ventas;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\CreaEsquemaNegocio;
use Tests\TestCase;

/** Series de comprobante y siguiente correlativo. */
class SerieDocumentoTest extends TestCase
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

    // ---------- Series ----------

    public function test_lista_series_del_tipo_con_su_siguiente_correlativo(): void
    {
        $this->crearSerie(self::RUC, '03', 'B001');
        $this->crearSerie(self::RUC, '01', 'F001');
        $this->crearSerie(self::OTRO_RUC, '03', 'B999');
        DB::table('ventas')->insert(['COD_DOCUMENTO' => '03', 'SERI_VENTA' => 'B001', 'NUME_VENTA' => '41', 'RUCEMPRESA' => self::RUC]);

        $this->actingAs($this->user)->getJson('/api/ventas/series?cod_documento=03')
            ->assertOk()
            ->assertExactJson([['serie' => 'B001', 'siguiente' => 42]]);
    }

    public function test_crea_serie_validando_formato_y_duplicados(): void
    {
        $this->actingAs($this->user)->postJson('/api/ventas/series', ['cod_documento' => '03', 'serie' => 'b002'])
            ->assertCreated()
            ->assertJsonPath('data.serie', 'B002')
            ->assertJsonPath('data.siguiente', 1);

        $this->actingAs($this->user)->postJson('/api/ventas/series', ['cod_documento' => '03', 'serie' => 'B002'])
            ->assertJsonValidationErrors(['serie']);
        $this->actingAs($this->user)->postJson('/api/ventas/series', ['cod_documento' => '03', 'serie' => 'F002'])
            ->assertJsonValidationErrors(['serie']);
        $this->actingAs($this->user)->postJson('/api/ventas/series', ['cod_documento' => '01', 'serie' => 'F00A1'])
            ->assertJsonValidationErrors(['serie']);
        $this->actingAs($this->user)->postJson('/api/ventas/series', ['cod_documento' => '12', 'serie' => 'T001'])
            ->assertCreated();
    }
}
