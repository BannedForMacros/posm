<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProveedoresController extends Controller
{
    /**
     * GET /api/proveedores
     */
    public function index()
    {
        // Listar proveedores activos
        try {
            $proveedores = DB::table('proveedores')
                ->where('estado', 1)
                ->where('user_ruc', auth()->user()->ruc)
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($proveedores);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener proveedores',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/proveedores
     */
    public function store(Request $request)
    {
        $request->validate([
            'ruc'          => 'required|string|size:11|unique:proveedores,ruc',
            'razon_social' => 'required|string|max:200',
            'direccion'    => 'nullable|string|max:200',
            'telefono'     => 'nullable|string|max:20',
            'email'        => 'nullable|string|max:100',
        ]);
    
        try {
            DB::beginTransaction();
    
            // Tomamos el RUC del usuario autenticado
            $userRuc = auth()->user()->ruc; 
            // o $request->user()->ruc, según tu configuración
    
            // Llamar al SP con 6 parámetros (ahora tenemos p_user_ruc)
            $result = DB::select("SELECT * FROM sp_crearProveedor(?, ?, ?, ?, ?, ?)", [
                $request->ruc,
                $request->razon_social,
                $request->direccion,
                $request->telefono,
                $request->email,
                $userRuc,  // Pasamos el RUC del usuario logueado
            ]);
    
            $id = $result[0]->id;
            DB::commit();
    
            return response()->json([
                'success' => true,
                'message' => 'Proveedor creado correctamente',
                'id'      => $id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al crear proveedor',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    

    /**
     * GET /api/proveedores/{id}
     */
    /**
     * Verifica que el proveedor pertenezca a la empresa del usuario autenticado.
     */
    private function perteneceAlUsuario($id): bool
    {
        return DB::table('proveedores')
            ->where('id', $id)
            ->where('user_ruc', auth()->user()->ruc)
            ->exists();
    }

    public function show($id)
    {
        try {
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Proveedor no encontrado'], 404);
            }
            $proveedorArr = DB::select("SELECT * FROM sp_obtenerProveedor(?)", [$id]);
            if (empty($proveedorArr)) {
                return response()->json(['error' => 'Proveedor no encontrado o inactivo'], 404);
            }
            return response()->json($proveedorArr[0]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener proveedor',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/proveedores/{id}
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'razon_social' => 'required|string|max:200',
            'direccion'    => 'nullable|string|max:200',
            'telefono'     => 'nullable|string|max:20',
            'email'        => 'nullable|string|max:100',
        ]);

        try {
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Proveedor no encontrado'], 404);
            }

            DB::beginTransaction();
            DB::statement("SELECT * FROM sp_actualizarProveedor(?, ?, ?, ?, ?)", [
                $id,
                $request->razon_social,
                $request->direccion,
                $request->telefono,
                $request->email
            ]);
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Proveedor actualizado correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al actualizar proveedor',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/proveedores/{id}
     */
    public function destroy($id)
    {
        try {
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Proveedor no encontrado'], 404);
            }
            DB::statement("SELECT * FROM sp_eliminarProveedor(?)", [$id]);
            return response()->json([
                'success' => true,
                'message' => 'Proveedor eliminado lógicamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al eliminar proveedor',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
