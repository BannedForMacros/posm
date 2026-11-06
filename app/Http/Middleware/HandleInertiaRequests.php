<?php

namespace App\Http\Middleware;

use App\Models\Empresa;
use App\Support\TenantContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $tenant = app(TenantContext::class);

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at?->toISOString(),
                    // El RUC depende de la empresa activa, que el middleware
                    // `tenant` resuelve después de este middleware.
                    'ruc' => fn () => $user->ruc,
                    'is_superadmin' => $user->esSuperadmin(),
                    'activo' => $user->estaActivo(),
                ] : null,
                'empresas' => $user
                    ? $user->empresasDisponibles()
                        ->map(fn (Empresa $empresa) => [
                            'id' => $empresa->id,
                            'ruc' => $empresa->ruc,
                            'nombre' => $empresa->nombre,
                            'razon_social' => $empresa->razon_social,
                            'rol' => $empresa->pivot?->rol ?? ($user->esSuperadmin() ? 'superadmin' : null),
                        ])
                        ->values()
                        ->all()
                    : [],
            ],
            // Se resuelve de forma diferida: `HandleInertiaRequests` corre
            // antes que el middleware que fija la empresa activa.
            'empresaActual' => function () use ($tenant, $user) {
                $empresa = $tenant->empresa();

                if (! $empresa) {
                    return null;
                }

                return [
                    'id' => $empresa->id,
                    'ruc' => $empresa->ruc,
                    'nombre' => $empresa->nombre,
                    'razon_social' => $empresa->razon_social,
                    'rol' => $user?->rolEnEmpresa($empresa->id),
                ];
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
