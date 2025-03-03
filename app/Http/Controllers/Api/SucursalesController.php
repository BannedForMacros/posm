<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SucursalesController extends Controller
{
    /**
     * Listar sucursales del usuario autenticado.
     * GET /api/sucursales
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }
        

        try {
            // Llamamos al SP para leer sucursales
            $sucursales = DB::select("CALL usp_sucursales_read(?)", [$user->ruc]);
            return response()->json($sucursales);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener sucursales',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear una nueva sucursal.
     * POST /api/sucursales
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre'    => 'required|string|max:100',
            'direccion' => 'nullable|string|max:200'
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        try {
            DB::statement("CALL usp_sucursales_create(?, ?, ?)", [
                $user->ruc,
                $request->nombre,
                $request->direccion
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Sucursal creada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al crear sucursal',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar sucursal.
     * PUT /api/sucursales/{id}
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre'    => 'required|string|max:100',
            'direccion' => 'nullable|string|max:200'
        ]);

        try {
            DB::statement("CALL usp_sucursales_update(?, ?, ?)", [
                $id,
                $request->nombre,
                $request->direccion
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Sucursal actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al actualizar sucursal',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar (lógicamente) sucursal.
     * DELETE /api/sucursales/{id}
     */
    public function destroy($id)
    {
        try {
            DB::statement("CALL usp_sucursales_delete(?)", [$id]);
            return response()->json([
                'success' => true,
                'message' => 'Sucursal eliminada lógicamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al eliminar sucursal',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
