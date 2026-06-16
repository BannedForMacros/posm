<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FacturacionController extends Controller
{
    // GET /api/facturacion
// En el método index() del controlador
public function index()
{
    try {
        $rucUsuario = auth()->user()->ruc;

        $facturaciones = DB::table('facturacion')
            ->join('proveedores', 'facturacion.cod_proveedor', '=', 'proveedores.id')
            ->where('facturacion.estado', 1)
            ->where('proveedores.user_ruc', $rucUsuario)
            ->select(
                'facturacion.*',
                'proveedores.razon_social as nombre_proveedor',
                'proveedores.ruc as ruc_proveedor'
            )
            ->orderBy('facturacion.created_at', 'desc')
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
        // Validaciones
        $request->validate([
            'tipo_documento'            => 'required|integer',
            // En BD son varchar(50): las series reales son alfanuméricas (p.ej. "F001")
            'num_serie'                 => 'required|string|max:50',
            'num_documento'             => 'required|string|max:50',
            'cod_proveedor'             => 'required|integer',
            'fecha'                     => 'required|date',
            'valor_compra'              => 'required|numeric',
            'detalles'                  => 'required|array',
            'detalles.*.cod_articulo'   => 'required|integer',
            'detalles.*.cantidad'       => 'required|numeric',
            'detalles.*.precio_unitario'=> 'required|numeric',

            // Campo opcional para indicar si se generará doc. de almacén
            'generar_almacen'  => 'boolean',
            // almacen_id es obligatorio cuando se genera documento de almacén
            'almacen_id'       => 'required_if:generar_almacen,true|integer',
        ]);

        try {
            DB::beginTransaction();

            // 1) Crear la cabecera Facturación vía SP
            $result = DB::select("SELECT * FROM sp_crearFacturacion(?, ?, ?, ?, ?, ?)", [
                $request->tipo_documento,
                $request->num_serie,
                $request->num_documento,
                $request->cod_proveedor,
                $request->fecha,
                $request->valor_compra
            ]);
            $facturacion_id = $result[0]->id;

            // 2) Crear los detalles vía SP
            foreach ($request->detalles as $detalle) {
                DB::statement("SELECT * FROM sp_crearDetalleFacturacion(?, ?, ?, ?)", [
                    $facturacion_id,
                    $detalle['cod_articulo'],
                    $detalle['cantidad'],
                    $detalle['precio_unitario']
                ]);
            }

            // 3) Si se va a generar documento de almacén
            if ($request->filled('generar_almacen') && $request->generar_almacen == true) {
                // a) Fijar la operación a ID=1 (por ejemplo, "Compra")
                $operacionId = 1; 

                // b) Tomar el user logueado
                $user = auth()->user();
                // El ruc del usuario (obligatorio: el inventario es por empresa)
                $rucUsuario = $user->ruc ?? null;
                if (!$rucUsuario) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'El usuario no tiene un RUC asignado; no se puede generar el documento de almacén.'
                    ], 422);
                }
                // El ID del usuario (si en tu warehouse_document lo guardas)
                $userId = $user->id ?? null;

                // c) Almacén destino (validado como requerido cuando generar_almacen=true)
                $almacenId = $request->almacen_id;

                // d) Crear la cabecera en warehouse_document
                $wdId = DB::table('warehouse_document')->insertGetId([
                    'ruc'             => $rucUsuario,
                    'almacen_id'      => $almacenId,
                    'facturacion_id'  => $facturacion_id,
                    'user_id'         => $userId,
                    'operacion_id'    => $operacionId,
                    'tipo_movimiento' => 'INGRESO',   // para compras
                    'fecha'           => Carbon::now(),
                    'estado'          => 1,
                    'created_at'      => Carbon::now(),
                    'updated_at'      => Carbon::now()
                ]);

                // e) Insertar detalles en warehouse_document_detail y actualizar stock
                foreach ($request->detalles as $det) {
                    // Insert en warehouse_document_detail
                    DB::table('warehouse_document_detail')->insert([
                        'warehouse_document_id' => $wdId,
                        'cod_articulo'          => $det['cod_articulo'],
                        'cantidad'              => $det['cantidad'],
                        'precio_unitario'       => $det['precio_unitario'],
                        'costo'                 => 0,  // si usas costo
                        'estado'                => 1,
                        'created_at'            => Carbon::now(),
                        'updated_at'            => Carbon::now()
                    ]);

                    // Actualizar/crear en inventario
                    $invent = DB::table('inventario')
                                ->where('ruc', $rucUsuario)
                                ->where('almacen_id', $almacenId)
                                ->where('cod_articulo', $det['cod_articulo'])
                                ->first();

                    if ($invent) {
                        // sumar stock
                        DB::table('inventario')
                            ->where('id', $invent->id)
                            ->update([
                                'stock' => $invent->stock + $det['cantidad'],
                                'updated_at' => Carbon::now()
                            ]);
                    } else {
                        // no existía => insertar
                        DB::table('inventario')->insert([
                            'ruc'          => $rucUsuario,
                            'almacen_id'   => $almacenId,
                            'cod_articulo' => $det['cod_articulo'],
                            'stock'        => $det['cantidad'],
                            'created_at'   => Carbon::now(),
                            'updated_at'   => Carbon::now()
                        ]);
                    }
                }
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

    /**
     * Verifica que la facturación pertenezca a la empresa del usuario autenticado
     * (la facturación se asocia al tenant a través del proveedor).
     */
    private function perteneceAlUsuario($id): bool
    {
        return DB::table('facturacion')
            ->join('proveedores', 'facturacion.cod_proveedor', '=', 'proveedores.id')
            ->where('facturacion.id', $id)
            ->where('proveedores.user_ruc', auth()->user()->ruc)
            ->exists();
    }

    // GET /api/facturacion/{id}
    public function show($id)
    {
        try {
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Facturación no encontrada'], 404);
            }
            // Obtener cabecera
            $factArr = DB::select("SELECT * FROM sp_obtenerFacturacion(?)", [$id]);
            if (empty($factArr)) {
                return response()->json(['error' => 'Facturación no encontrada o inactiva'], 404);
            }
            $fact = $factArr[0];

            // Obtener detalles
            $detalles = DB::select("SELECT * FROM sp_obtenerDetallesFacturacion(?)", [$id]);

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
            // Opcional: si no se envían detalles, solo se actualiza la cabecera
            'detalles'     => 'sometimes|array|min:1'
        ]);

        try {
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Facturación no encontrada'], 404);
            }

            DB::beginTransaction();

            // Actualizar la cabecera
            DB::statement("SELECT * FROM sp_actualizarFacturacion(?, ?, ?)", [
                $id,
                $request->fecha,
                $request->valor_compra
            ]);

            // Si llegan detalles, se reemplazan; si no, solo se actualizó la cabecera
            if ($request->filled('detalles')) {
                // Eliminar lógicamente los detalles anteriores
                $detallesExist = DB::select("SELECT * FROM sp_obtenerDetallesFacturacion(?)", [$id]);
                foreach ($detallesExist as $detalle) {
                    DB::statement("SELECT * FROM sp_eliminarDetalleFacturacion(?)", [$detalle->id]);
                }

                // Insertar los nuevos
                foreach ($request->detalles as $detalle) {
                    DB::statement("SELECT * FROM sp_crearDetalleFacturacion(?, ?, ?, ?)", [
                        $id,
                        $detalle['cod_articulo'],
                        $detalle['cantidad'],
                        $detalle['precio_unitario']
                    ]);
                }
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
            if (!$this->perteneceAlUsuario($id)) {
                return response()->json(['error' => 'Facturación no encontrada'], 404);
            }
            // Eliminar lógicamente la cabecera
            DB::statement("SELECT * FROM sp_eliminarFacturacion(?)", [$id]);
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
