<?php

namespace Tests\Feature\Admin;

use App\Models\Empresa;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MultitenancyTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_puede_ver_el_panel(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $this->actingAs($superadmin)
            ->get('/admin')
            ->assertOk();
    }

    public function test_usuario_normal_no_puede_entrar_al_panel(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_superadmin_puede_crear_una_empresa(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $response = $this->actingAs($superadmin)->post('/admin/empresas', [
            'ruc' => '20999999999',
            'razon_social' => 'Empresa Demo SAC',
            'nombre_comercial' => 'Demo',
            'direccion' => 'Av. Siempre Viva 123',
            'telefono' => '999888777',
            'email' => 'demo@example.com',
            'estado' => true,
        ]);

        $empresa = Empresa::where('ruc', '20999999999')->firstOrFail();

        $response->assertRedirect(route('admin.empresas.show', $empresa));
        $this->assertDatabaseHas('empresas', [
            'ruc' => '20999999999',
            'razon_social' => 'Empresa Demo SAC',
        ]);
    }

    public function test_usuario_puede_pertenecer_a_varias_empresas_y_cambiar_de_contexto(): void
    {
        $empresaA = $this->crearEmpresa('20111111111', 'Empresa A');
        $empresaB = $this->crearEmpresa('20222222222', 'Empresa B');

        $user = User::factory()->create();
        $empresaA->users()->attach($user->id, ['rol' => 'admin', 'activo' => true]);
        $empresaB->users()->attach($user->id, ['rol' => 'operador', 'activo' => true]);

        Route::middleware(['web', 'auth', 'tenant'])->get('/_test/tenant', function () {
            return app(TenantContext::class)->ruc();
        });

        $this->actingAs($user)
            ->post("/empresa-activa/{$empresaB->id}", ['destino' => 'dashboard'])
            ->assertRedirect(route('dashboard'));

        $this->assertSame($empresaB->id, session('empresa_activa_id'));

        $this->get('/_test/tenant')->assertSee('20222222222');
    }

    public function test_superadmin_puede_asignar_un_usuario_a_una_empresa(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $empresa = $this->crearEmpresa('20333333333', 'Empresa C');
        $user = User::factory()->create();

        $this->actingAs($superadmin)
            ->post("/admin/empresas/{$empresa->id}/usuarios", [
                'user_id' => $user->id,
                'rol' => 'operador',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('empresa_user', [
            'empresa_id' => $empresa->id,
            'user_id' => $user->id,
            'rol' => 'operador',
            'activo' => true,
        ]);
    }

    public function test_superadmin_puede_crear_un_local_para_una_empresa(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $empresa = $this->crearEmpresa('20444444444', 'Empresa D');

        $this->actingAs($superadmin)
            ->post('/admin/locales', [
                'empresa_id' => $empresa->id,
                'nombre' => 'Local Centro',
                'direccion' => 'Jr. Comercio 456',
                'estado' => true,
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sucursal', [
            'empresa_id' => $empresa->id,
            'user_ruc' => $empresa->ruc,
            'nombre' => 'Local Centro',
        ]);
    }

    public function test_usuario_sin_empresa_es_redirigido_a_sin_empresa(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertRedirect('/sin-empresa');
    }

    public function test_usuario_inactivo_es_deslogueado(): void
    {
        $user = User::factory()->inactive()->create();

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertRedirect('/login');

        $this->assertGuest();
    }

    public function test_no_se_puede_eliminar_la_propia_cuenta(): void
    {
        $superadmin = User::factory()->superadmin()->create();

        $this->actingAs($superadmin)
            ->delete("/admin/usuarios/{$superadmin->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $superadmin->id]);
    }

    public function test_paginas_del_panel_cargan_correctamente(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $empresa = $this->crearEmpresa('20555555555', 'Empresa E');

        $urls = [
            '/admin',
            '/admin/empresas',
            "/admin/empresas/{$empresa->id}",
            '/admin/usuarios',
            '/admin/locales',
        ];

        foreach ($urls as $url) {
            $this->actingAs($superadmin)->get($url)->assertOk();
        }
    }

    public function test_superadmin_puede_actualizar_una_empresa(): void
    {
        $superadmin = User::factory()->superadmin()->create();
        $empresa = $this->crearEmpresa('20777777777', 'Empresa G');

        $this->actingAs($superadmin)
            ->put("/admin/empresas/{$empresa->id}", [
                'razon_social' => 'Empresa G Actualizada SAC',
                'nombre_comercial' => 'G Actualizada',
                'estado' => true,
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('empresas', [
            'id' => $empresa->id,
            'ruc' => '20777777777',
            'razon_social' => 'Empresa G Actualizada SAC',
        ]);
    }

    public function test_usuario_sin_empresa_ve_la_pantalla_sin_empresa(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/sin-empresa')
            ->assertOk();
    }

    public function test_usuario_con_empresa_puede_ver_el_dashboard(): void
    {
        $empresa = $this->crearEmpresa('20666666666', 'Empresa F');
        $user = User::factory()->create();
        $empresa->users()->attach($user->id, ['rol' => 'admin', 'activo' => true]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertOk();
    }

    public function test_las_props_compartidas_incluyen_la_empresa_activa(): void
    {
        $empresa = $this->crearEmpresa('20888888888', 'Empresa H');
        $user = User::factory()->create();
        $empresa->users()->attach($user->id, ['rol' => 'operador', 'activo' => true]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('empresaActual.id', $empresa->id)
                ->where('empresaActual.ruc', '20888888888')
                ->where('empresaActual.rol', 'operador')
                ->where('auth.user.ruc', '20888888888'));
    }

    private function crearEmpresa(string $ruc, string $razonSocial): Empresa
    {
        return Empresa::create([
            'ruc' => $ruc,
            'razon_social' => $razonSocial,
            'estado' => true,
        ]);
    }
}
