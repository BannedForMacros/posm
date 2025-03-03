<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlmacenesController extends Controller
{
    /**
     * GET /api/almacenes
     * Llamamos a sp_obtenerAlmacenesByUser(?)
     * para listar todos los almacenes de las sucursales
     * que pertenecen al usuario autenticado.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        try {
            $almacenes = DB::select("CALL sp_obtenerAlmacenesByUser(?)", [$user->ruc]);
            return response()->json($almacenes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener almacenes',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/almacenes
     * Crea un almacén + pivote con sp_crearAlmacenConSucursal(?)
     * Body: { sucursal_id, nombre, ubicacion }
     */
    public function store(Request $request)
    {
        $request->validate([
            'sucursal_id' => 'required|integer',
            'nombre'      => 'required|string|max:100',
            'ubicacion'   => 'required|string|max:200'
        ]);

        try {
            $result = DB::select("CALL sp_crearAlmacenConSucursal(?, ?, ?)", [
                $request->sucursal_id,
                $request->nombre,
                $request->ubicacion
            ]);

            $id = $result[0]->id ?? null;

            return response()->json([
                'success' => true,
                'message' => 'Almacén creado correctamente',
                'id'      => $id
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al crear almacén',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/almacenes/{id}
     * Actualiza con sp_actualizarAlmacen(?)
     * Body: { nombre, ubicacion }
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre'    => 'required|string|max:100',
            'ubicacion' => 'required|string|max:200'
        ]);

        try {
            DB::statement("CALL sp_actualizarAlmacen(?, ?, ?)", [
                $id,
                $request->nombre,
                $request->ubicacion
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Almacén actualizado correctamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al actualizar almacén',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/almacenes/{id}
     * Elimina (lógicamente) con sp_eliminarAlmacen(?)
     */
    public function destroy($id)
    {
        try {
            DB::statement("CALL sp_eliminarAlmacen(?)", [$id]);

            return response()->json([
                'success' => true,
                'message' => 'Almacén eliminado lógicamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al eliminar almacén',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
