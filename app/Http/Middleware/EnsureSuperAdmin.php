<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            $request->user()?->esSuperadmin(),
            403,
            'Esta sección es exclusiva del superadministrador.'
        );

        return $next($request);
    }
}
