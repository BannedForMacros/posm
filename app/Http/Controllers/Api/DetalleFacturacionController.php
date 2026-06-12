<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DetalleFacturacionController extends Controller
{
    /**
     * Verifica que la facturación pertenezca a la empresa del usuario autenticado
     * (la facturación se asocia al tenant a través del proveedor).
     */
    private function facturacionPerteneceAlUsuario($facturacionId): bool
    {
        return DB::table('facturacion')
            ->join('proveedores', 'facturacion.cod_proveedor', '=', 'proveedores.id')
            ->where('facturacion.id', $facturacionId)
            ->where('proveedores.user_ruc', auth()->user()->ruc)
            ->exists();
    }

    /**
     * Igual que la anterior, pero partiendo del id del detalle.
     */
    private function detallePerteneceAlUsuario($detalleId): bool
    {
        return DB::table('detallefacturacion')
            ->join('facturacion', 'detallefacturacion.facturacion_id', '=', 'facturacion.id')
            ->join('proveedores', 'facturacion.cod_proveedor', '=', 'proveedores.id')
            ->where('detallefacturacion.id', $detalleId)
            ->where('proveedores.user_ruc', auth()->user()->ruc)
            ->exists();
    }

    // GET /api/detalle-facturacion?facturacion_id=...
    public function index(Request $request)
    {
        $facturacion_id = $request->query('facturacion_id');
        if (!$facturacion_id) {
            return response()->json(['error' => 'Falta facturacion_id'], 400);
        }

        if (!$this->facturacionPerteneceAlUsuario($facturacion_id)) {
            return response()->json(['error' => 'Facturación no encontrada'], 404);
        }

        try {
            $detalles = DB::select("CALL sp_obtenerDetallesFacturacion(?)", [$facturacion_id]);
            return response()->json($detalles);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener detalles',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/detalle-facturacion
    public function store(Request $request)
    {
        $request->validate([
            'facturacion_id' => 'required|integer',
            'cod_articulo'   => 'required|integer',
            'cantidad'       => 'required|numeric',
            'precio_unitario'=> 'required|numeric'
        ]);

        if (!$this->facturacionPerteneceAlUsuario($request->facturacion_id)) {
            return response()->json(['error' => 'Facturación no encontrada'], 404);
        }

        try {
            DB::beginTransaction();
            $result = DB::select("CALL sp_crearDetalleFacturacion(?, ?, ?, ?)", [
                $request->facturacion_id,
                $request->cod_articulo,
                $request->cantidad,
                $request->precio_unitario
            ]);
            $id = $result[0]->id;
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Detalle creado correctamente',
                'id'      => $id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al crear detalle',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/detalle-facturacion/{id}
    public function show($id)
    {
        // Normalmente no hay un sp_obtenerDetalleIndividual, 
        // podrías crearlo o hacer un SELECT manual
        if (!$this->detallePerteneceAlUsuario($id)) {
            return response()->json(['error' => 'Detalle no encontrado'], 404);
        }

        try {
            $detalle = DB::table('detallefacturacion')
                ->where('id', $id)
                ->where('estado', 1)
                ->first();
            if (!$detalle) {
                return response()->json(['error' => 'Detalle no encontrado o inactivo'], 404);
            }
            return response()->json($detalle);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener detalle',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/detalle-facturacion/{id}
    public function update(Request $request, $id)
    {
        $request->validate([
            'cantidad'       => 'required|numeric',
            'precio_unitario'=> 'required|numeric'
        ]);

        if (!$this->detallePerteneceAlUsuario($id)) {
            return response()->json(['error' => 'Detalle no encontrado'], 404);
        }

        try {
            DB::beginTransaction();
            DB::statement("CALL sp_actualizarDetalleFacturacion(?, ?, ?)", [
                $id,
                $request->cantidad,
                $request->precio_unitario
            ]);
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Detalle actualizado correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al actualizar detalle',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/detalle-facturacion/{id}
    public function destroy($id)
    {
        if (!$this->detallePerteneceAlUsuario($id)) {
            return response()->json(['error' => 'Detalle no encontrado'], 404);
        }

        try {
            DB::statement("CALL sp_eliminarDetalleFacturacion(?)", [$id]);
            return response()->json([
                'success' => true,
                'message' => 'Detalle eliminado lógicamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al eliminar detalle',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
