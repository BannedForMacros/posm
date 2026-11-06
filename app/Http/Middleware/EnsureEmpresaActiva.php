<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmpresaActiva
{
    /**
     * Evita que se opere sin una empresa seleccionada. El superadmin puede
     * entrar a una empresa desde el panel; el resto de usuarios necesita
     * pertenecer a por lo menos una.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var TenantContext $tenant */
        $tenant = app(TenantContext::class);

        if ($tenant->hasEmpresa()) {
            return $next($request);
        }

        if ($request->user()?->esSuperadmin()) {
            return redirect()
                ->route('admin.dashboard')
                ->with('error', 'Selecciona una empresa para operar en el POS.');
        }

        return redirect()->route('sin-empresa');
    }
}
