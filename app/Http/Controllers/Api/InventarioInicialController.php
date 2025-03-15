<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventarioInicialController extends Controller
{
    /**
     * GET /api/inventario-inicial
     * Llama a tu SP para listar artículos del inventario inicial (con filtros).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        try {
            $almacenId  = $request->query('almacen_id', 0);
            $busqueda   = $request->query('busqueda', '');

            // Llamamos a tu SP (ajusta el nombre si cambió):
            $lista = DB::select("CALL sp_listarArticulosInventario(?, ?, ?)", [
                $user->ruc,
                $almacenId,
                $busqueda
            ]);

            return response()->json($lista, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener inventario inicial',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/inventario-inicial/registrar-stock
     * Body: { sucursal_id, almacen_id, cod_articulo, stock_inicial }
     * Registra el stock inicial usando un SP (o tu lógica).
     */
    public function registrarStockInicial(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        // Validaciones
        $request->validate([
            'almacen_id'    => 'required|integer',
            'cod_articulo'  => 'required|integer',
            'stock_inicial' => 'required|numeric'
        ]);

        try {
            // Llamada a tu SP para registrar/actualizar stock inicial
            $result = DB::select('CALL sp_registrarStockInicial(?, ?, ?, ?)', [
                $user->ruc,
                $request->almacen_id,
                $request->cod_articulo,
                $request->stock_inicial
            ]);

            // Si el SP retorna algún error en 'error_message'
            if (!empty($result) && isset($result[0]->error_message)) {
                return response()->json([
                    'error' => true,
                    'message' => $result[0]->error_message
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Stock inicial registrado/actualizado correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al registrar stock inicial',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/inventario-inicial/update-estado
     * Body: { codarticulo, activo }
     * Actualiza el campo 'activo' en la tabla 'inventario_inicial'.
     */
    public function updateEstado(Request $request)
    {
        $request->validate([
            'codarticulo' => 'required|integer',
            'activo'      => 'required|integer'
        ]);

        // Ajusta si necesitas filtrar también por ruc, sucursal, etc.
        DB::table('inventario_inicial')
            ->where('cod_articulo', $request->codarticulo)
            ->update(['activo' => $request->activo]);

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado correctamente'
        ], 200);
    }

    public function showStockInicial(Request $request)
    {
        $almacenId   = $request->query('almacen_id');
        $codArticulo = $request->query('cod_articulo');
    
        // Verificamos si vienen ambos parámetros
        if (!$almacenId || !$codArticulo) {
            return response()->json(['error' => 'Faltan parámetros'], 400);
        }
    
        try {
            $fila = DB::table('inventario_inicial')
                ->where('almacen_id', $almacenId)
                ->where('cod_articulo', $codArticulo)
                ->where('ruc', auth()->user()->ruc)
                ->first();
    
            if (!$fila) {
                return response()->json(['stock_inicial' => 0]);
            }
    
            return response()->json(['stock_inicial' => $fila->stock_inicial]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener stock inicial',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function registrarMinMax(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        // Validaciones mínimas
        $request->validate([
            'almacen_id'   => 'required|integer',
            'cod_articulo' => 'required|integer',
            'stock_minimo' => 'nullable|numeric',
            'stock_maximo' => 'nullable|numeric'
        ]);

        try {
            // Convertir '' a NULL si deseas
            $stockMin = $request->input('stock_minimo') === '' ? null : $request->input('stock_minimo');
            $stockMax = $request->input('stock_maximo') === '' ? null : $request->input('stock_maximo');

            // Llamar al SP
            DB::select('CALL sp_registrarStockMinMax(?, ?, ?, ?, ?)', [
                $user->ruc,
                $request->almacen_id,
                $request->cod_articulo,
                $stockMin ?? 0, // si deseas guardar 0 en caso de null
                $stockMax ?? 0  // o lo que gustes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Stock mínimo/máximo asignado correctamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al asignar stock mínimo/máximo',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
    
