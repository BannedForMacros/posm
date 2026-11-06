<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmpresaActivaController extends Controller
{
    public function store(Request $request, Empresa $empresa): RedirectResponse
    {
        abort_unless($empresa->estado, 403, 'La empresa está desactivada.');
        abort_unless(
            $request->user()->perteneceAEmpresa($empresa->id),
            403,
            'No tienes acceso a esta empresa.'
        );

        $request->session()->put('empresa_activa_id', $empresa->id);

        if ($request->input('destino') === 'dashboard') {
            return redirect()
                ->route('dashboard')
                ->with('success', 'Ahora estás operando en '.$empresa->nombre.'.');
        }

        return back()->with('success', 'Empresa activa: '.$empresa->nombre.'.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget('empresa_activa_id');

        if ($request->user()?->esSuperadmin()) {
            return redirect()
                ->route('admin.dashboard')
                ->with('success', 'Saliste del contexto de la empresa.');
        }

        return redirect()->route('sin-empresa');
    }
}
