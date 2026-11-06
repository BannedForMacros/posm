<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLocalRequest;
use App\Http\Requests\Admin\UpdateLocalRequest;
use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LocalController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'empresa_id' => (string) $request->query('empresa_id', ''),
            'estado' => (string) $request->query('estado', 'todos'),
        ];

        $locales = Sucursal::query()
            ->with('empresa')
            ->when($filters['search'] !== '', function ($query) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $query->where(function ($query) use ($search) {
                    $query->where('nombre', 'like', $search)
                        ->orWhere('direccion', 'like', $search);
                });
            })
            ->when($filters['empresa_id'] !== '', fn ($query) => $query->where('empresa_id', $filters['empresa_id']))
            ->when($filters['estado'] === 'activos', fn ($query) => $query->where('estado', true))
            ->when($filters['estado'] === 'inactivos', fn ($query) => $query->where('estado', false))
            ->orderBy('nombre')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Sucursal $local) => [
                'id' => $local->id,
                'empresa_id' => $local->empresa_id,
                'empresa_nombre' => $local->empresa?->nombre,
                'empresa_ruc' => $local->empresa?->ruc,
                'nombre' => $local->nombre,
                'direccion' => $local->direccion,
                'estado' => $local->estado,
                'created_at' => $local->created_at?->format('d/m/Y'),
            ]);

        return Inertia::render('Admin/Locales/Index', [
            'locales' => $locales,
            'empresas' => $this->empresasOptions(),
            'filters' => $filters,
        ]);
    }

    public function store(StoreLocalRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $empresa = Empresa::findOrFail($data['empresa_id']);

        Sucursal::create([
            'empresa_id' => $empresa->id,
            'user_ruc' => $empresa->ruc,
            'nombre' => $data['nombre'],
            'direccion' => $data['direccion'] ?? null,
            'estado' => $request->boolean('estado', true),
        ]);

        return back()->with('success', 'Local creado correctamente.');
    }

    public function update(UpdateLocalRequest $request, Sucursal $local): RedirectResponse
    {
        $data = $request->validated();

        $local->update([
            'nombre' => $data['nombre'],
            'direccion' => $data['direccion'] ?? null,
            'estado' => $request->boolean('estado', true),
            'user_ruc' => $local->empresa?->ruc ?? $local->user_ruc,
        ]);

        return back()->with('success', 'Local actualizado correctamente.');
    }

    public function toggleEstado(Sucursal $local): RedirectResponse
    {
        $local->update(['estado' => ! $local->estado]);

        return back()->with(
            'success',
            $local->estado
                ? 'Local activado correctamente.'
                : 'Local desactivado correctamente.'
        );
    }

    /**
     * @return array<int, array{id:int, nombre:string, ruc:string}>
     */
    private function empresasOptions(): array
    {
        return Empresa::query()
            ->orderBy('razon_social')
            ->get()
            ->map(fn (Empresa $empresa) => [
                'id' => $empresa->id,
                'nombre' => $empresa->nombre,
                'ruc' => $empresa->ruc,
            ])
            ->values()
            ->all();
    }
}
