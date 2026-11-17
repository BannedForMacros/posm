<?php

namespace Tests\Feature\Ventas;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\CreaEsquemaNegocio;
use Tests\TestCase;

/** Búsqueda de clientes por RUC/DNI: primero los guardados, luego la API de consulta. */
class ClienteBusquedaTest extends TestCase
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
        config(['services.consulta_documento.url' => 'https://consulta.test/ApiRuc/Consulta/ConsultaRuc']);
    }

    private function guardarCliente(string $ruc, string $doc, string $nombre): void
    {
        DB::table('clientes')->insert([
            'ruc_empresa' => $ruc, 'tipo_documento' => strlen($doc) === 11 ? 'RUC' : 'DNI', 'numero_documento' => $doc,
            'razon_social' => $nombre, 'direccion' => 'Calle 1', 'fuente' => 'venta', 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    // ---------- Clientes ----------

    private const API = 'consulta.test/*';

    public function test_cliente_guardado_se_devuelve_sin_consultar_la_api(): void
    {
        Http::fake();
        $this->guardarCliente(self::RUC, '46779354', 'JUAN PÉREZ');

        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=46779354')
            ->assertOk()
            ->assertJsonPath('fuente', 'local')
            ->assertJsonPath('cliente.razon_social', 'JUAN PÉREZ');

        Http::assertNothingSent();
    }

    public function test_ruc_nuevo_se_consulta_en_la_api_de_dbperu(): void
    {
        // Respuesta real de la API (los campos sin dato vienen como "-").
        Http::fake([self::API => Http::response(['success' => true, 'result' => [
            'RUC' => '20100070970', 'RazonSocial' => "SUPERMERCADOS PERUANOS SOCIEDAD ANONIMA ''O '' S.P.S.A.",
            'Condicion' => 'HABIDO', 'Estado' => 'ACTIVO', 'Direccion' => 'CAL.MORELLI181P-2- San Borja-Lima-Lima',
            'Apellidos' => '-', 'Nombres' => '-',
        ]])]);

        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=20100070970')
            ->assertOk()
            ->assertJsonPath('fuente', 'consulta')
            ->assertJsonPath('cliente.tipo_documento', 'RUC')
            ->assertJsonPath('cliente.razon_social', "SUPERMERCADOS PERUANOS SOCIEDAD ANONIMA 'O ' S.P.S.A.")
            ->assertJsonPath('cliente.direccion', 'CAL.MORELLI181P-2- San Borja-Lima-Lima')
            ->assertJsonPath('cliente.estado', 'ACTIVO');

        Http::assertSent(fn ($req) => $req->url() === 'https://consulta.test/ApiRuc/Consulta/ConsultaRuc'
            && $req->method() === 'POST' && $req['nroDocumento'] === '20100070970');
    }

    public function test_dni_arma_el_nombre_con_apellidos_y_nombres(): void
    {
        Http::fake([self::API => Http::response(['success' => true, 'result' => [
            'RazonSocial' => '-', 'Apellidos' => 'PEREZ RIOS', 'Nombres' => 'JUAN', 'Direccion' => '-',
        ]])]);

        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=46779354')
            ->assertOk()
            ->assertJsonPath('cliente.tipo_documento', 'DNI')
            ->assertJsonPath('cliente.razon_social', 'PEREZ RIOS JUAN')
            ->assertJsonPath('cliente.direccion', null);
    }

    public function test_cliente_de_otra_empresa_no_se_filtra(): void
    {
        $this->guardarCliente(self::OTRO_RUC, '46779354', 'CLIENTE AJENO');
        Http::fake([self::API => Http::response(['success' => true, 'result' => ['RazonSocial' => 'NOMBRE RENIEC']])]);

        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=46779354')
            ->assertOk()
            ->assertJsonPath('fuente', 'consulta')
            ->assertJsonPath('cliente.razon_social', 'NOMBRE RENIEC');
    }

    public function test_documento_no_encontrado_pide_ingreso_manual(): void
    {
        Http::fake([self::API => Http::response(['success' => false, 'msg' => 'Nro DNI no valido.'])]);

        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=46779354')
            ->assertNotFound()
            ->assertJsonPath('manual', true);
    }

    public function test_si_la_api_falla_responde_503_con_ingreso_manual(): void
    {
        Http::fake([self::API => Http::response('error', 500)]);

        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=46779354')
            ->assertStatus(503)
            ->assertJsonPath('manual', true);
    }

    public function test_documento_invalido_se_rechaza_antes_de_consultar(): void
    {
        Http::fake();

        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=20100070971')->assertUnprocessable();
        $this->actingAs($this->user)->getJson('/api/clientes/buscar?documento=123')->assertUnprocessable();

        Http::assertNothingSent();
    }
}
