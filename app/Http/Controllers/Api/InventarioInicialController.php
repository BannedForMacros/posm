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
            $sucursalId = $request->query('sucursal_id', 0);
            $almacenId  = $request->query('almacen_id', 0);
            $busqueda   = $request->query('busqueda', '');

            // Llamamos a tu SP (ajusta el nombre si cambió):
            $lista = DB::select("CALL sp_listarArticulosInventario(?, ?, ?, ?)", [
                $user->ruc,
                $sucursalId,
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
            'sucursal_id'   => 'required|integer',
            'almacen_id'    => 'required|integer',
            'cod_articulo'  => 'required|integer',
            'stock_inicial' => 'required|numeric'
        ]);

        try {
            // Llamada a tu SP para registrar/actualizar stock inicial
            $result = DB::select('CALL sp_registrarStockInicial(?, ?, ?, ?, ?)', [
                $user->ruc,
                $request->sucursal_id,
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
}
