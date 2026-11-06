<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AsignarEmpresaRequest;
use App\Http\Requests\Admin\StoreEmpresaRequest;
use App\Http\Requests\Admin\UpdateEmpresaRequest;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class EmpresaController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'estado' => (string) $request->query('estado', 'todas'),
        ];

        $empresas = Empresa::query()
            ->withCount(['users', 'sucursales'])
            ->when($filters['search'] !== '', function ($query) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $query->where(function ($query) use ($search) {
                    $query->where('ruc', 'like', $search)
                        ->orWhere('razon_social', 'like', $search)
                        ->orWhere('nombre_comercial', 'like', $search);
                });
            })
            ->when($filters['estado'] === 'activas', fn ($query) => $query->where('estado', true))
            ->when($filters['estado'] === 'inactivas', fn ($query) => $query->where('estado', false))
            ->orderBy('razon_social')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Empresa $empresa) => [
                'id' => $empresa->id,
                'ruc' => $empresa->ruc,
                'razon_social' => $empresa->razon_social,
                'nombre_comercial' => $empresa->nombre_comercial,
                'nombre' => $empresa->nombre,
                'direccion' => $empresa->direccion,
                'telefono' => $empresa->telefono,
                'email' => $empresa->email,
                'estado' => $empresa->estado,
                'users_count' => $empresa->users_count,
                'sucursales_count' => $empresa->sucursales_count,
                'created_at' => $empresa->created_at?->format('d/m/Y'),
            ]);

        return Inertia::render('Admin/Empresas/Index', [
            'empresas' => $empresas,
            'filters' => $filters,
        ]);
    }

    public function show(Empresa $empresa): Response
    {
        $empresa->load([
            'users' => fn ($query) => $query->orderBy('name'),
            'sucursales' => fn ($query) => $query->orderBy('nombre'),
        ]);

        $usuariosAsignados = $empresa->users
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_superadmin' => $user->esSuperadmin(),
                'activo' => $user->estaActivo(),
                'rol' => $user->pivot->rol,
                'membresia_activa' => (bool) $user->pivot->activo,
            ])
            ->values();

        $usuariosDisponibles = User::query()
            ->whereNotIn('id', $usuariosAsignados->pluck('id'))
            ->orderBy('name')
            ->limit(200)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);

        return Inertia::render('Admin/Empresas/Show', [
            'empresa' => [
                'id' => $empresa->id,
                'ruc' => $empresa->ruc,
                'razon_social' => $empresa->razon_social,
                'nombre_comercial' => $empresa->nombre_comercial,
                'nombre' => $empresa->nombre,
                'direccion' => $empresa->direccion,
                'telefono' => $empresa->telefono,
                'email' => $empresa->email,
                'estado' => $empresa->estado,
                'created_at' => $empresa->created_at?->format('d/m/Y'),
            ],
            'usuarios' => $usuariosAsignados,
            'usuariosDisponibles' => $usuariosDisponibles,
            'locales' => $empresa->sucursales->map(fn ($local) => [
                'id' => $local->id,
                'empresa_id' => $local->empresa_id,
                'nombre' => $local->nombre,
                'direccion' => $local->direccion,
                'estado' => $local->estado,
                'created_at' => $local->created_at?->format('d/m/Y'),
            ])->values(),
            'stats' => $this->statsFor($empresa),
        ]);
    }

    public function store(StoreEmpresaRequest $request): RedirectResponse
    {
        $empresa = Empresa::create([
            ...$request->validated(),
            'estado' => $request->boolean('estado', true),
        ]);

        return redirect()
            ->route('admin.empresas.show', $empresa)
            ->with('success', 'Empresa creada correctamente.');
    }

    public function update(UpdateEmpresaRequest $request, Empresa $empresa): RedirectResponse
    {
        $data = $request->safe()->except(['ruc']);

        if ($request->has('estado')) {
            $data['estado'] = $request->boolean('estado');
        }

        $empresa->update($data);

        return back()->with('success', 'Empresa actualizada correctamente.');
    }

    public function toggleEstado(Empresa $empresa): RedirectResponse
    {
        $empresa->update(['estado' => ! $empresa->estado]);

        return back()->with(
            'success',
            $empresa->estado
                ? 'Empresa activada correctamente.'
                : 'Empresa desactivada correctamente.'
        );
    }

    public function attachUser(AsignarEmpresaRequest $request, Empresa $empresa): RedirectResponse
    {
        $data = $request->validated();

        $empresa->users()->syncWithoutDetaching([
            $data['user_id'] => [
                'rol' => $data['rol'],
                'activo' => true,
            ],
        ]);

        $empresa->users()->updateExistingPivot($data['user_id'], [
            'rol' => $data['rol'],
            'activo' => true,
        ]);

        return back()->with('success', 'Usuario asignado a la empresa.');
    }

    public function detachUser(Empresa $empresa, User $usuario): RedirectResponse
    {
        $pivot = $empresa->users()->whereKey($usuario->id)->first()?->pivot;

        if (! $pivot) {
            return back()->with('error', 'El usuario no pertenece a esta empresa.');
        }

        if ($pivot->rol === 'admin') {
            $admins = $empresa->users()
                ->wherePivot('rol', 'admin')
                ->wherePivot('activo', true)
                ->count();

            if ($admins <= 1) {
                return back()->with('error', 'La empresa necesita al menos un administrador.');
            }
        }

        $empresa->users()->detach($usuario->id);

        return back()->with('success', 'Usuario retirado de la empresa.');
    }

    /**
     * @return array<string, int>
     */
    private function statsFor(Empresa $empresa): array
    {
        return [
            'articulos' => $this->countByRuc('articulos', 'ruc', $empresa->ruc),
            'ventas' => $this->countByRuc('ventas', 'RUCEMPRESA', $empresa->ruc),
            'compras' => $this->countCompras($empresa->ruc),
            'proveedores' => $this->countByRuc('proveedores', 'user_ruc', $empresa->ruc),
        ];
    }

    private function countByRuc(string $table, string $column, string $ruc): int
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return 0;
        }

        return (int) DB::table($table)->where($column, $ruc)->count();
    }

    private function countCompras(string $ruc): int
    {
        if (! Schema::hasTable('facturacion') || ! Schema::hasTable('proveedores')) {
            return 0;
        }

        return (int) DB::table('facturacion')
            ->join('proveedores', 'proveedores.id', '=', 'facturacion.cod_proveedor')
            ->where('proveedores.user_ruc', $ruc)
            ->count();
    }
}
