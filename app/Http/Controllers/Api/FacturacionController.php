<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FacturacionController extends Controller
{
    // GET /api/facturacion
// En el método index() del controlador
public function index()
{
    try {
        $facturaciones = DB::table('Facturacion')
            ->join('Proveedores', 'Facturacion.cod_proveedor', '=', 'Proveedores.id')
            ->where('Facturacion.estado', 1)
            ->select(
                'Facturacion.*',
                'Proveedores.razon_social as nombre_proveedor',
                'Proveedores.ruc as ruc_proveedor' // <- Agregar esta línea
            )
            ->orderBy('Facturacion.created_at', 'desc')
            ->get();
            
        return response()->json($facturaciones);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Error al obtener facturaciones',
            'message' => $e->getMessage()
        ], 500);
    }
}

    // POST /api/facturacion
    public function store(Request $request)
    {
        $request->validate([
            'tipo_documento' => 'required|integer',
            'num_serie'      => 'required|integer',
            'num_documento'  => 'required|integer',
            'cod_proveedor'  => 'required|integer',
            'fecha'          => 'required|date',
            'valor_compra'   => 'required|numeric',
            'detalles'       => 'required|array',
            'detalles.*.cod_articulo'    => 'required|integer',
            'detalles.*.cantidad'        => 'required|numeric',
            'detalles.*.precio_unitario' => 'required|numeric',
        ]);

        try {
            DB::beginTransaction();

            // Crear la cabecera
            $result = DB::select("CALL sp_crearFacturacion(?, ?, ?, ?, ?, ?)", [
                $request->tipo_documento,
                $request->num_serie,
                $request->num_documento,
                $request->cod_proveedor,
                $request->fecha,
                $request->valor_compra
            ]);
            $facturacion_id = $result[0]->id;

            // Crear los detalles
            foreach ($request->detalles as $detalle) {
                DB::statement("CALL sp_crearDetalleFacturacion(?, ?, ?, ?)", [
                    $facturacion_id,
                    $detalle['cod_articulo'],
                    $detalle['cantidad'],
                    $detalle['precio_unitario']
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Facturación creada correctamente',
                'id'      => $facturacion_id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al crear la facturación',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/facturacion/{id}
    public function show($id)
    {
        try {
            // Obtener cabecera
            $factArr = DB::select("CALL sp_obtenerFacturacion(?)", [$id]);
            if (empty($factArr)) {
                return response()->json(['error' => 'Facturación no encontrada o inactiva'], 404);
            }
            $fact = $factArr[0];

            // Obtener detalles
            $detalles = DB::select("CALL sp_obtenerDetallesFacturacion(?)", [$id]);

            return response()->json([
                'facturacion' => $fact,
                'detalles'    => $detalles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener la facturación',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/facturacion/{id}
    public function update(Request $request, $id)
    {
        $request->validate([
            'fecha'        => 'required|date',
            'valor_compra' => 'required|numeric',
            'detalles'     => 'required|array'
        ]);

        try {
            DB::beginTransaction();

            // Actualizar la cabecera
            DB::statement("CALL sp_actualizarFacturacion(?, ?, ?)", [
                $id,
                $request->fecha,
                $request->valor_compra
            ]);

            // Eliminar lógicamente los detalles anteriores
            $detallesExist = DB::select("CALL sp_obtenerDetallesFacturacion(?)", [$id]);
            foreach ($detallesExist as $detalle) {
                DB::statement("CALL sp_eliminarDetalleFacturacion(?)", [$detalle->id]);
            }

            // Insertar los nuevos
            foreach ($request->detalles as $detalle) {
                DB::statement("CALL sp_crearDetalleFacturacion(?, ?, ?, ?)", [
                    $id,
                    $detalle['cod_articulo'],
                    $detalle['cantidad'],
                    $detalle['precio_unitario']
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Facturación actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al actualizar la facturación',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/facturacion/{id}
    public function destroy($id)
    {
        try {
            // Eliminar lógicamente la cabecera
            DB::statement("CALL sp_eliminarFacturacion(?)", [$id]);
            return response()->json([
                'success' => true,
                'message' => 'Facturación eliminada lógicamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al eliminar la facturación',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
