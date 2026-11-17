<?php

namespace Tests\Feature\Articulos;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreaEsquemaNegocio;
use Tests\TestCase;

class ArticuloUnidadMedidaTest extends TestCase
{
    use CreaEsquemaNegocio;
    use RefreshDatabase;

    private const RUC = '20100070970';

    private $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->crearEsquemaNegocio();
        [, $this->user] = $this->empresaConUsuario(self::RUC);
    }

    public function test_crea_articulo_con_unidad_de_medida(): void
    {
        $this->actingAs($this->user)->postJson('/api/articulos-manage', [
            'codigo' => 'azu-1k', 'nombrearticulo' => 'Azúcar rubia', 'codunidad' => 2,
        ])
            ->assertCreated()
            ->assertJsonPath('data.codigo', 'AZU-1K')
            ->assertJsonPath('data.codunidad', 2);
    }

    public function test_sin_unidad_se_asigna_unidad_niu(): void
    {
        $this->actingAs($this->user)->postJson('/api/articulos-manage', ['nombrearticulo' => 'Lapicero'])
            ->assertCreated()
            ->assertJsonPath('data.codunidad', 1);
    }

    public function test_unidad_inexistente_se_rechaza(): void
    {
        $this->actingAs($this->user)->postJson('/api/articulos-manage', ['nombrearticulo' => 'Lapicero', 'codunidad' => 99])
            ->assertJsonValidationErrors(['codunidad']);
    }

    public function test_editar_cambia_la_unidad_y_vacio_la_conserva(): void
    {
        $id = $this->actingAs($this->user)->postJson('/api/articulos-manage', ['nombrearticulo' => 'Queso', 'codunidad' => 1])
            ->json('data.codarticulo');

        $this->actingAs($this->user)->putJson("/api/articulos-manage/{$id}", ['nombrearticulo' => 'Queso', 'codunidad' => 2])
            ->assertOk()->assertJsonPath('data.codunidad', 2);
        $this->actingAs($this->user)->putJson("/api/articulos-manage/{$id}", ['nombrearticulo' => 'Queso fresco', 'codunidad' => ''])
            ->assertOk()->assertJsonPath('data.codunidad', 2);
    }

    public function test_cantidades_negativas_en_stock_se_rechazan(): void
    {
        $this->actingAs($this->user)->postJson('/api/articulos-manage', [
            'nombrearticulo' => 'Queso', 'stockminimo' => -1, 'stockmaximo' => -3,
        ])->assertJsonValidationErrors(['stockminimo', 'stockmaximo']);
    }
}
