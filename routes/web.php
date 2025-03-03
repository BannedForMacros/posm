<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controladores
use App\Http\Controllers\Api\ArticuloController;
use App\Http\Controllers\Api\VentasController;
use App\Http\Controllers\Api\FamiliaController;
use App\Http\Controllers\Api\ArticuloManageController;
use App\Http\Controllers\Api\FacturacionController; 
use App\Http\Controllers\Api\ProveedoresController;
use App\Http\Controllers\Api\SucursalesController;
use App\Http\Controllers\Api\AlmacenesController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\ListaPreciosController;






// Ruta raíz
Route::get('/', function () {
    return Inertia::render('Welcome');
});

// Rutas protegidas por autenticación
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard', [
            'user' => auth()->user(),
        ]);
    })->name('dashboard');

    /**
     * FAMILIAS (CRUD) - usando 'id' como PK
     */
    Route::get('/familias', function () {
        return Inertia::render('Familias/index');
    })->name('familias');

    Route::prefix('api/familias')->group(function () {
        // Listar familias
        Route::get('/', [FamiliaController::class, 'index'])
            ->name('api.familias.index');
        // Crear nueva familia
        Route::post('/', [FamiliaController::class, 'store'])
            ->name('api.familias.store');
        // Mostrar familia por ID
        Route::get('/{id}', [FamiliaController::class, 'show'])
            ->name('api.familias.show');
        // Actualizar familia por ID
        Route::put('/{id}', [FamiliaController::class, 'update'])
            ->name('api.familias.update');
        // Eliminar (lógica) familia por ID
        Route::delete('/{id}', [FamiliaController::class, 'destroy'])
            ->name('api.familias.destroy');
    });
        // Vista Inertia para sucursales
        Route::get('/sucursales', function() {
            return Inertia::render('Sucursales/index');
        })->name('sucursales.index');
    
        // API Sucursales
        Route::prefix('api/sucursales')->group(function() {
            Route::get('/', [SucursalesController::class, 'index'])
                ->name('api.sucursales.index');
            Route::post('/', [SucursalesController::class, 'store'])
                ->name('api.sucursales.store');
            Route::put('/{id}', [SucursalesController::class, 'update'])
                ->name('api.sucursales.update');
            Route::delete('/{id}', [SucursalesController::class, 'destroy'])
                ->name('api.sucursales.destroy');
        });

// Vista Inertia para Almacenes
Route::get('/almacenes', function() {
    return Inertia::render('Almacenes/Index');
})->name('almacenes.index');

// Rutas API para Almacenes
Route::prefix('api/almacenes')->group(function() {
    Route::get('/', [AlmacenesController::class, 'index'])
         ->name('api.almacenes.index');

    Route::post('/', [AlmacenesController::class, 'store'])
         ->name('api.almacenes.store');

    Route::put('/{id}', [AlmacenesController::class, 'update'])
         ->name('api.almacenes.update');

    Route::delete('/{id}', [AlmacenesController::class, 'destroy'])
         ->name('api.almacenes.destroy');
});

        // Vista Inertia para Inventario
        Route::get('/inventario', function () {
            return Inertia::render('Inventario/Index');
        })->name('inventario.index');
    
        // API Inventario
        Route::prefix('api/inventario')->group(function () {
            Route::get('/', [InventarioController::class, 'index'])
                ->name('api.inventario.index');
        
            // Quitar 'inventario/' en la parte de la ruta
            Route::post('/registrar-stock', [InventarioController::class, 'registrarStockInicial'])
                ->name('api.inventario.registrar_stock');
                    // IMPORTANTE: define la ruta POST /api/inventario/update-estado
            Route::post('/update-estado', [InventarioController::class, 'updateEstado'])
                ->name('api.inventario.update_estado');
        });
        
        //LISTA PRECIOS: 
        Route::prefix('api/listaprecios')->group(function() {
            // GET /api/listaprecios
            Route::get('/', [ListaPreciosController::class, 'index']);
        
            // POST /api/listaprecios (crear lista con detalle)
            Route::post('/', [ListaPreciosController::class, 'store']);
        
            // GET /api/listaprecios/detalle/{id} (obtener detalle)
            Route::get('/detalle/{id}', [ListaPreciosController::class, 'showDetalle']);
        
            // PUT /api/listaprecios/detalle/{id} (editar precios)
            Route::put('/detalle/{id}', [ListaPreciosController::class, 'updateDetalle']);
        
            // PUT /api/listaprecios/desactivar/{id}
            Route::put('/desactivar/{id}', [ListaPreciosController::class, 'desactivar']);
          });
        
          // Vista React principal
          Route::get('/lista-precios', function () {
            return Inertia::render('ListaPrecios/index');
          })->name('lista_precios.index');

    /**
     * ARTÍCULOS MANAGEMENT (CRUD)
     * (sigue usando 'codarticulo' como PK, si así lo deseas)
     */
    Route::get('/articulos-manage', function () {
        return Inertia::render('ArticuloManage/index');
    })->name('articulos.manage');

    Route::prefix('api/articulos-manage')->group(function () {
        Route::get('/', [ArticuloManageController::class, 'index'])
            ->name('api.articulos_manage.index');
        Route::post('/', [ArticuloManageController::class, 'store'])
            ->name('api.articulos_manage.store');
        Route::get('/{codarticulo}', [ArticuloManageController::class, 'show'])
            ->name('api.articulos_manage.show');
        Route::put('/{codarticulo}', [ArticuloManageController::class, 'update'])
            ->name('api.articulos_manage.update');
        Route::delete('/{codarticulo}', [ArticuloManageController::class, 'destroy'])
            ->name('api.articulos_manage.destroy');
    });

    /**
     * COMPRAS (antes “facturacion”)
     * - Rutas de la API (prefix('api/compras'))
     * - Ruta para la vista Inertia (GET /compras)
     */
    Route::prefix('api')->group(function() {
        Route::prefix('compras')->group(function() {
            Route::get('/', [FacturacionController::class, 'index']);   // GET /api/compras
            Route::post('/', [FacturacionController::class, 'store']); // POST /api/compras
            Route::get('/{id}', [FacturacionController::class, 'show']);      
            Route::put('/{id}', [FacturacionController::class, 'update']);    
            Route::delete('/{id}', [FacturacionController::class, 'destroy']);
        });
    });

    // Vista principal para Compras
    // (renderiza tu componente Inertia, p.ej. 'Compras/index' o 'ComprasManage')

    Route::prefix('api')->group(function() {
        Route::prefix('facturacion')->group(function() {
            Route::get('/', [FacturacionController::class, 'index']);
            Route::post('/', [FacturacionController::class, 'store']);
            Route::get('/{id}', [FacturacionController::class, 'show']);
            Route::put('/{id}', [FacturacionController::class, 'update']);
            Route::delete('/{id}', [FacturacionController::class, 'destroy']);
        });
    });
    
    Route::get('/facturacion', function() {
        return Inertia::render('Compras/index'); 
    })->name('facturacion.manage');
    

    /**
     * VENTAS
     */
    Route::get('/ventas', function () {
        return Inertia::render('Ventas');
    })->name('ventas');

    Route::prefix('api/ventas')->group(function () {
        Route::get('/', [VentasController::class, 'index'])
            ->name('api.ventas.index');

        Route::get('/detalles/{cod_documento}/{seri_venta}/{nume_venta}',
            [VentasController::class, 'showDetails']
        )->name('api.ventas.detalles');

        Route::get('/formas-pago/{cod_documento}/{seri_venta}/{nume_venta}',
            [VentasController::class, 'showPaymentMethods']
        )->name('api.ventas.formas_pago');

        // Gráficas
        Route::get('/grafica-ventas-por-dia', [VentasController::class, 'graficaVentasPorDia'])
            ->name('api.ventas.grafica_por_dia');
        Route::get('/grafica-ventas-por-formapago', [VentasController::class, 'graficaVentasPorFormaPago'])
            ->name('api.ventas.grafica_por_formapago');
        Route::get('/grafica-ventas-por-articulo', [VentasController::class, 'graficaVentasPorArticulo'])
            ->name('api.ventas.grafica_por_articulo');
        Route::get('/grafica-top-articulos', [VentasController::class, 'graficaTopArticulos'])
            ->name('api.ventas.grafica_top_articulos');

        Route::get('/estadisticas-generales', [VentasController::class, 'estadisticasGenerales'])
            ->name('api.ventas.estadisticas_generales');
            
        Route::get('/detalle-completo/{cod_documento}/{seri_venta}/{nume_venta}', 
            [VentasController::class, 'getDetalleCompleto']
        )->name('api.ventas.detalle_completo');
    });

     /**
     * PROVEEDORES
     */
    // Ruta para la vista Inertia
    Route::get('/proveedores', function () {
        return Inertia::render('Proveedores/index');
    })->name('proveedores.index');

    // Rutas de la API para Proveedores
    Route::prefix('api/proveedores')->group(function () {
        Route::get('/', [ProveedoresController::class, 'index']);   // GET /api/proveedores
        Route::post('/', [ProveedoresController::class, 'store']); // POST /api/proveedores
        Route::get('/{id}', [ProveedoresController::class, 'show']);
        Route::put('/{id}', [ProveedoresController::class, 'update']);
        Route::delete('/{id}', [ProveedoresController::class, 'destroy']);
    });
});

/**
 * ARTÍCULOS (Rutas públicas: si las mantienes)
 */
Route::get('/articulos', function () {
    return Inertia::render('Articulos');
})->name('articulos');

Route::get('/articulos/{id}', function ($id) {
    return Inertia::render('ArticuloDetalle', ['id' => $id]);
})->name('articulos.detalle');

Route::prefix('api/articulos')->group(function () {
    Route::get('/', [ArticuloController::class, 'index'])
        ->name('api.articulos');
    Route::get('/{id}', [ArticuloController::class, 'show'])
        ->name('api.articulos.show');
});

require __DIR__.'/auth.php';
