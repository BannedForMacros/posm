<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * La ruta a la "página de inicio" de tu aplicación.
     * Los usuarios suelen redirigirse aquí después de la autenticación.
     *
     * @var string
     */
    public const HOME = '/dashboard';

    /**
     * Configura las vinculaciones de modelos, filtros de patrones, etc.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        // Aquí se agrupan las rutas de la aplicación
        $this->routes(function () {
            // Rutas API: Se les asigna el prefijo "api" automáticamente
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            // Rutas web
            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configura los limitadores de velocidad para la aplicación.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip()
            );
        });
    }
}
