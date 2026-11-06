<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $empresas = Empresa::query();
        $usuarios = User::query();

        $stats = [
            'empresas' => (clone $empresas)->count(),
            'empresas_activas' => (clone $empresas)->where('estado', true)->count(),
            'usuarios' => (clone $usuarios)->count(),
            'usuarios_activos' => (clone $usuarios)->where('activo', true)->count(),
            'superadmins' => (clone $usuarios)->where('is_superadmin', true)->count(),
            'locales' => Schema::hasTable('sucursal') ? Sucursal::count() : 0,
            'membresias' => DB::table('empresa_user')->where('activo', true)->count(),
        ];

        $empresasRecientes = Empresa::query()
            ->withCount(['users', 'sucursales'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Empresa $empresa) => [
                'id' => $empresa->id,
                'ruc' => $empresa->ruc,
                'nombre' => $empresa->nombre,
                'razon_social' => $empresa->razon_social,
                'estado' => $empresa->estado,
                'users_count' => $empresa->users_count,
                'sucursales_count' => $empresa->sucursales_count,
                'created_at' => $empresa->created_at?->format('d/m/Y'),
            ]);

        $usuariosRecientes = User::query()
            ->with(['empresas' => fn ($query) => $query->orderBy('empresas.razon_social')])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_superadmin' => $user->esSuperadmin(),
                'activo' => $user->estaActivo(),
                'empresas' => $user->empresas->map(fn (Empresa $empresa) => [
                    'id' => $empresa->id,
                    'nombre' => $empresa->nombre,
                    'rol' => $empresa->pivot->rol,
                ])->values(),
            ]);

        $topEmpresas = Empresa::query()
            ->withCount('users')
            ->orderByDesc('users_count')
            ->limit(5)
            ->get()
            ->map(fn (Empresa $empresa) => [
                'id' => $empresa->id,
                'nombre' => $empresa->nombre,
                'users_count' => $empresa->users_count,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'empresasRecientes' => $empresasRecientes,
            'usuariosRecientes' => $usuariosRecientes,
            'topEmpresas' => $topEmpresas,
        ]);
    }
}
