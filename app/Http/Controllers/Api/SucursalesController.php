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
    
            // Filtramos las sucursales para devolver solo aquellas con estado = 1
            $sucursalesFiltradas = array_filter($sucursales, function($sucursal) {
                return $sucursal->estado == 1;
            });
    
            // array_filter preserve las claves, se recomienda reindexarlas con array_values
            return response()->json(array_values($sucursalesFiltradas));
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
            DB::beginTransaction();
    
            // Ejecuta el stored procedure para insertar la sucursal
            DB::statement("CALL usp_sucursales_create(?, ?, ?)", [
                $user->ruc,
                $request->nombre,
                $request->direccion
            ]);
    
            // Después de insertar, obtenemos el registro recién creado.
            // Se asume que la tabla se llama "sucursales" y que el registro
            // más reciente para el usuario es el insertado.
            $resultado = DB::select("SELECT * FROM sucursal WHERE user_ruc = ? ORDER BY id DESC LIMIT 1", [$user->ruc]);
    
            DB::commit();
    
            return response()->json([
                'success' => true,
                'data'    => $resultado[0] ?? null,
                'message' => 'Sucursal creada correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
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
    /**
     * Verifica que la sucursal pertenezca a la empresa del usuario autenticado.
     */
    private function perteneceAlUsuario($id): bool
    {
        return DB::table('sucursal')
            ->where('id', $id)
            ->where('user_ruc', auth()->user()->ruc)
            ->exists();
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre'    => 'required|string|max:100',
            'direccion' => 'nullable|string|max:200'
        ]);

        try {
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Sucursal no encontrada'], 404);
            }
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
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Sucursal no encontrada'], 404);
            }
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
