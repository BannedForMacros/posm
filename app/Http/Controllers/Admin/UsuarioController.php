<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUsuarioRequest;
use App\Http\Requests\Admin\UpdateUsuarioRequest;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UsuarioController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'rol' => (string) $request->query('rol', 'todos'),
            'estado' => (string) $request->query('estado', 'todos'),
        ];

        $usuarios = User::query()
            ->with(['empresas' => fn ($query) => $query->orderBy('empresas.razon_social')])
            ->when($filters['search'] !== '', function ($query) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', $search)
                        ->orWhere('email', 'like', $search);
                });
            })
            ->when($filters['rol'] === 'superadmin', fn ($query) => $query->where('is_superadmin', true))
            ->when($filters['rol'] === 'usuario', fn ($query) => $query->where('is_superadmin', false))
            ->when($filters['estado'] === 'activos', fn ($query) => $query->where('activo', true))
            ->when($filters['estado'] === 'inactivos', fn ($query) => $query->where('activo', false))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_superadmin' => $user->esSuperadmin(),
                'activo' => $user->estaActivo(),
                'created_at' => $user->created_at?->format('d/m/Y'),
                'empresas' => $user->empresas->map(fn (Empresa $empresa) => [
                    'id' => $empresa->id,
                    'nombre' => $empresa->nombre,
                    'ruc' => $empresa->ruc,
                    'rol' => $empresa->pivot->rol,
                    'activo' => (bool) $empresa->pivot->activo,
                ])->values(),
            ]);

        return Inertia::render('Admin/Usuarios/Index', [
            'usuarios' => $usuarios,
            'empresas' => $this->empresasOptions(),
            'filters' => $filters,
        ]);
    }

    public function store(StoreUsuarioRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'is_superadmin' => $request->boolean('is_superadmin'),
                'activo' => $request->boolean('activo', true),
                'ruc' => null,
            ]);

            $this->syncEmpresas($user, $data['empresas'] ?? []);
        });

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(UpdateUsuarioRequest $request, User $usuario): RedirectResponse
    {
        $data = $request->validated();
        $esUnoMismo = $request->user()->id === $usuario->id;

        if ($esUnoMismo && $request->has('is_superadmin') && ! $request->boolean('is_superadmin')) {
            return back()->withErrors([
                'is_superadmin' => 'No puedes quitarte el rol de superadministrador.',
            ]);
        }

        if ($esUnoMismo && $request->has('activo') && ! $request->boolean('activo')) {
            return back()->withErrors([
                'activo' => 'No puedes desactivar tu propia cuenta.',
            ]);
        }

        DB::transaction(function () use ($request, $usuario, $data) {
            $attributes = [
                'name' => $data['name'],
                'email' => $data['email'],
                'is_superadmin' => $request->boolean('is_superadmin'),
                'activo' => $request->boolean('activo', true),
            ];

            if (! empty($data['password'])) {
                $attributes['password'] = $data['password'];
            }

            $usuario->update($attributes);
            $this->syncEmpresas($usuario, $data['empresas'] ?? []);
        });

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function toggleEstado(Request $request, User $usuario): RedirectResponse
    {
        if ($request->user()->id === $usuario->id) {
            return back()->with('error', 'No puedes desactivar tu propia cuenta.');
        }

        $usuario->update(['activo' => ! $usuario->activo]);

        return back()->with(
            'success',
            $usuario->activo
                ? 'Usuario activado correctamente.'
                : 'Usuario desactivado correctamente.'
        );
    }

    public function destroy(Request $request, User $usuario): RedirectResponse
    {
        if ($request->user()->id === $usuario->id) {
            return back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        if ($usuario->esSuperadmin() && User::where('is_superadmin', true)->count() <= 1) {
            return back()->with('error', 'No puedes eliminar al último superadministrador.');
        }

        $usuario->delete();

        return back()->with('success', 'Usuario eliminado correctamente.');
    }

    /**
     * @param  array<int, array{id:int, rol:string}>  $empresas
     */
    private function syncEmpresas(User $user, array $empresas): void
    {
        $sync = [];

        foreach ($empresas as $empresa) {
            $sync[(int) $empresa['id']] = [
                'rol' => $empresa['rol'],
                'activo' => true,
            ];
        }

        $user->empresas()->sync($sync);
    }

    /**
     * @return array<int, array{id:int, nombre:string, ruc:string, estado:bool}>
     */
    private function empresasOptions(): array
    {
        return Empresa::query()
            ->orderByDesc('estado')
            ->orderBy('razon_social')
            ->get()
            ->map(fn (Empresa $empresa) => [
                'id' => $empresa->id,
                'nombre' => $empresa->nombre,
                'ruc' => $empresa->ruc,
                'estado' => $empresa->estado,
            ])
            ->values()
            ->all();
    }
}
