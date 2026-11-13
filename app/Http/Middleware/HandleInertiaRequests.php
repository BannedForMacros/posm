<?php

namespace App\Http\Middleware;

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
        return [
            ...parent::share($request),
            // Token CSRF vigente: el login/logout regeneran la sesión sin recargar
            // el HTML, así que el <meta csrf-token> se sincroniza desde aquí.
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $request->user(),
            ],
        ];
    }
}
