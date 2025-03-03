<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ArticuloController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Aquí se registran las rutas de la API. Estas rutas se agrupan por defecto
| con el middleware "api" y reciben el prefijo "api" a través del RouteServiceProvider.
| Si definimos un grupo adicional con el prefijo "ai", la URL completa será:
| http://127.0.0.1:8000/api/ai/articulos
|
*/

Route::group(['prefix' => 'ai'], function () {
    Route::get('/articulos', [ArticuloController::class, 'index']);
});
