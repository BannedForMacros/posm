<?php

namespace App\Http\Middleware;

use App\Models\Empresa;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ResolveEmpresaActiva
{
    /**
     * Resuelve la empresa activa del usuario y la deja disponible en el
     * TenantContext. Para usuarios normales exige al menos una membresía.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        /** @var TenantContext $tenant */
        $tenant = app(TenantContext::class);
        $tenant->clear();

        if (! $user->estaActivo()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('login')
                ->with('error', 'Tu cuenta está desactivada. Contacta al administrador.');
        }

        $empresas = $user->empresasDisponibles();
        $empresaId = $request->session()->get('empresa_activa_id');
        $empresa = $empresas->firstWhere('id', $empresaId);

        if (! $user->esSuperadmin()) {
            $empresa ??= $empresas->first();

            if ($empresa) {
                $request->session()->put('empresa_activa_id', $empresa->id);
            }
        } elseif ($empresaId && ! $empresa) {
            $request->session()->forget('empresa_activa_id');
        }

        if ($empresa instanceof Empresa) {
            $tenant->set($empresa);
            $user->setRelation('empresaActual', $empresa);
        }

        return $next($request);
    }
}
