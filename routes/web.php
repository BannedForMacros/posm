<?php

use Illuminate\Http\Request;
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
use App\Http\Controllers\Api\InventarioInicialController;
use App\Http\Controllers\Api\ListaPreciosController;
use App\Http\Controllers\Api\OperacionController;
use App\Http\Controllers\Api\WarehouseDocumentController;
use App\Http\Controllers\Api\WarehouseDocumentDetailController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DetalleFacturacionController;
use App\Http\Controllers\Api\TipoDocumentoController;










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


Route::prefix('api/dashboard')->group(function () {
    Route::get('/graficos', [DashboardController::class, 'dashboardGraficos'])
         ->name('api.dashboard.graficos');
});

// *********************************************************************
    // SECCIÓN CORREGIDA: Warehouse Documents dentro del grupo de autenticación
    // *********************************************************************
    Route::get('/warehouse-documents', function (Request $request) {
        return Inertia::render('Warehouse/Index', [ // <-- si tu archivo es "Index.jsx"
            'articulos' => [],
            'filters'   => [
                'almacen_id' => null,
                'search'     => ''
            ],
        ]);
    })->name('warehouse_documents.index');

    Route::get('/warehouse-movements', function () {
        return Inertia::render('Warehouse/MovementsIndex'); // <-- si tu archivo es "MovementsIndex.jsx"
    })->name('warehouse.movements.index');

    Route::prefix('api')->group(function() {
        // Rutas warehouse-documents
        Route::prefix('warehouse-documents')->group(function() {
            Route::get('/', [WarehouseDocumentController::class, 'index']);
            Route::get('/{id}', [WarehouseDocumentController::class, 'show']);
        });
        // RUTA /api/warehouse-movements
        Route::get('/warehouse-movements', [WarehouseDocumentDetailController::class, 'movementsIndex']);
    });
    

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

        // Vista Inertia para Inventario Inicial
        Route::get('/inventario-inicial', function () {
            return Inertia::render('InventarioInicial/Index');
        })->name('inventario_inicial.index');

        // API Inventario Inicial
        Route::prefix('api/inventario-inicial')->group(function () {
            // GET /api/inventario-inicial
            Route::get('/', [InventarioInicialController::class, 'index'])
                ->name('api.inventario_inicial.index');
            
            // POST /api/inventario-inicial/registrar-stock
            Route::post('/registrar-stock', [InventarioInicialController::class, 'registrarStockInicial'])
                ->name('api.inventario_inicial.registrar_stock');
        
            // POST /api/inventario-inicial/update-estado
            Route::post('/update-estado', [InventarioInicialController::class, 'updateEstado'])
                ->name('api.inventario_inicial.update_estado');
            
            Route::get('/stock', [InventarioInicialController::class, 'showStockInicial'])
                ->name('api.inventario_inicial.show_stock');
            
            Route::post('/registrar-minmax', [InventarioInicialController::class, 'registrarMinMax'])
                ->name('api.inventario_inicial.registrar_minmax');
        });


            // Rutas de inventario
            // Rutas API
            Route::prefix('api')->group(function() {
                Route::get('/inventario', [InventarioController::class, 'apiIndex'])
                    ->name('api.inventario.index');
            });

            // Ruta Inertia (si quieres una vista en /inventario)
            Route::get('/inventario', function () {
                return Inertia::render('Inventario/Index');
            })->name('inventario.index');

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
    // TIPO DOCUMENTO : 

Route::get('tipo_documento', [TipoDocumentoController::class, 'index']);
Route::get('/api/tipo_documento', [TipoDocumentoController::class, 'index']);



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
    
    // Rutas para DetalleFacturacion
    Route::prefix('detalle-facturacion')->group(function() {
        // GET /api/detalle-facturacion?facturacion_id=...
        Route::get('/', [DetalleFacturacionController::class, 'index']);
        
        // POST /api/detalle-facturacion
        Route::post('/', [DetalleFacturacionController::class, 'store']);
        
        // GET /api/detalle-facturacion/{id}
        Route::get('/{id}', [DetalleFacturacionController::class, 'show']);
        
        // PUT /api/detalle-facturacion/{id}
        Route::put('/{id}', [DetalleFacturacionController::class, 'update']);
        
        // DELETE /api/detalle-facturacion/{id}
        Route::delete('/{id}', [DetalleFacturacionController::class, 'destroy']);
    });
    });
    
    Route::get('/facturacion', function() {
        return Inertia::render('Compras/index'); 
    })->name('facturacion.manage');
    

    //OPERACION SUNAT
    Route::prefix('api')->group(function() {
        Route::prefix('operaciones')->group(function() {
            Route::get('/', [OperacionController::class, 'index']);
            Route::post('/', [OperacionController::class, 'store']);
            Route::get('/{id}', [OperacionController::class, 'show']);
            Route::put('/{id}', [OperacionController::class, 'update']);
            Route::delete('/{id}', [OperacionController::class, 'destroy']);
        });
    });
/**
 * VENTAS
 */
// Vista principal de Ventas con Inertia
Route::get('/ventas', function () {
    return Inertia::render('Ventas/index'); // <- Componente React principal de Ventas
})->name('ventas.index');

// Rutas de la API para Ventas
Route::prefix('api/ventas')->group(function () {

    // Listar ventas
    Route::get('/', [VentasController::class, 'index'])
         ->name('api.ventas.index');

    // Crear nueva venta (POST /api/ventas)
    Route::post('/', [VentasController::class, 'store'])
         ->name('api.ventas.store');

    // Rutas para detalles y formas de pago (si las mantienes):
    Route::get('/detalles/{cod_documento}/{seri_venta}/{nume_venta}',
        [VentasController::class, 'showDetails']
    )->name('api.ventas.detalles');

    Route::get('/formas-pago/{cod_documento}/{seri_venta}/{nume_venta}',
        [VentasController::class, 'showPaymentMethods']
    )->name('api.ventas.formas_pago');

    // Las gráficas y estadísticas viven en DashboardController (api/dashboard/graficos).
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

    /**
     * ARTÍCULOS — requieren sesión: los datos son por empresa (ruc)
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
});

require __DIR__.'/auth.php';
