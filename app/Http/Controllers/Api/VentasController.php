<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Models\WarehouseDocument; 
use App\Models\WarehouseDocumentDetail;
use Carbon\Carbon;

class VentasController extends Controller
{
    /**
     * Retorna las ventas asociadas al RUC del usuario autenticado
     * usando el procedimiento almacenado.
     * 
     * URL: GET /api/ventas
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Obtener el RUC del usuario autenticado
        $ruc = $user->ruc;

        try {
            // Llamar al procedimiento almacenado para obtener ventas
            $ventas = DB::select("CALL ObtenerVentasPorRUC(?)", [$ruc]);
            return response()->json($ventas);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener las ventas',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene los detalles de una venta específica.
     * 
     * URL: GET /api/ventas/detalles/{cod_documento}/{seri_venta}/{nume_venta}
     *
     * @param string $cod_documento
     * @param string $seri_venta
     * @param int $nume_venta
     * @return \Illuminate\Http\JsonResponse
     */


     public function store(Request $request)
     {
         $request->validate([
             'almacen_id'           => 'required|integer',
             'fecha'                => 'required|date',
             // En este ejemplo, operacion_id lo fijamos en 2, 
             // o lo tomamos del request si quieres personalizar
             // 'operacion_id'         => 'required|integer',
     
             // Facturación o venta (por si fuera nulo)
             'facturacion_id'       => 'nullable|integer',
             'venta_id'             => 'nullable|integer',
     
             // Detalles
             'detalles'                         => 'required|array',
             'detalles.*.cod_articulo'          => 'required|integer',
             'detalles.*.cantidad'              => 'required|numeric',
             'detalles.*.precio_unitario'       => 'required|numeric',
         ]);
     
         // Usuario actual
         $user = $request->user();
         if (!$user) {
             return response()->json(['error' => 'Usuario no autenticado'], 401);
         }
     
         // Asignamos su RUC
         $rucUsuario = $user->ruc;  // <-- de aquí lo sacamos
     
         DB::beginTransaction();
         try {
             // 0) Validar stock disponible ANTES de registrar la salida:
             //    antes se truncaba a 0 en silencio y el inventario quedaba
             //    descuadrado respecto al documento de almacén.
             $sinStock = [];
             foreach ($request->detalles as $det) {
                 $invent = DB::table('inventario')
                     ->where('ruc', $rucUsuario)
                     ->where('almacen_id', $request->almacen_id)
                     ->where('cod_articulo', $det['cod_articulo'])
                     ->first();

                 $disponible = $invent->stock ?? 0;
                 if ($disponible < $det['cantidad']) {
                     $sinStock[] = [
                         'cod_articulo' => $det['cod_articulo'],
                         'solicitado'   => $det['cantidad'],
                         'disponible'   => $disponible,
                     ];
                 }
             }

             if (!empty($sinStock)) {
                 DB::rollBack();
                 return response()->json([
                     'error'    => 'Stock insuficiente para uno o más artículos',
                     'detalles' => $sinStock,
                 ], 422);
             }

             // 1) Crear la cabecera en warehouse_document
             $warehouseDoc = new WarehouseDocument();
             // USAR RUC DEL USUARIO, no del request
             $warehouseDoc->ruc             = $rucUsuario;  
             $warehouseDoc->almacen_id      = $request->almacen_id;
             $warehouseDoc->facturacion_id  = $request->facturacion_id ?? null;
             $warehouseDoc->venta_id        = $request->venta_id ?? null;
             $warehouseDoc->user_id         = $user->id;
             // Podrías fijar la operación en 2 = "Venta" si así lo definiste
             $warehouseDoc->operacion_id    = 2; 
             // Tipo de movimiento "SALIDA" para ventas
             $warehouseDoc->tipo_movimiento = 'SALIDA';
             $warehouseDoc->fecha           = $request->fecha;
             $warehouseDoc->estado          = 1;
             $warehouseDoc->created_at      = now();
             $warehouseDoc->updated_at      = now();
             $warehouseDoc->save();
     
             // 2) Insertar detalles en warehouse_document_detail
             foreach ($request->detalles as $det) {
                 $newDetail = new WarehouseDocumentDetail();
                 $newDetail->warehouse_document_id = $warehouseDoc->id;
                 $newDetail->cod_articulo         = $det['cod_articulo'];
                 $newDetail->cantidad             = $det['cantidad'];
                 $newDetail->precio_unitario      = $det['precio_unitario'];
                 $newDetail->estado               = 1;
                 $newDetail->created_at           = now();
                 $newDetail->updated_at           = now();
                 $newDetail->save();
             }
     
             // 3) Actualizar inventario
             if ($warehouseDoc->tipo_movimiento === 'SALIDA') {
                 // restamos stock
                 foreach ($request->detalles as $det) {
                     $invent = DB::table('inventario')
                         ->where('ruc', $rucUsuario)
                         ->where('almacen_id', $request->almacen_id)
                         ->where('cod_articulo', $det['cod_articulo'])
                         ->first();
     
                     // El stock ya fue validado arriba: aquí siempre existe y alcanza
                     DB::table('inventario')
                         ->where('id', $invent->id)
                         ->update([
                             'stock'      => $invent->stock - $det['cantidad'],
                             'updated_at' => now()
                         ]);
                 }
             } elseif ($warehouseDoc->tipo_movimiento === 'INGRESO') {
                 // sumar stock (por si en algún caso es una venta que ingresa algo)
                 // ... 
             }
     
             DB::commit();
             return response()->json([
                 'success' => true,
                 'message' => 'Documento de almacén (Venta) creado correctamente',
                 'warehouse_document_id' => $warehouseDoc->id
             ], 201);
     
         } catch (\Exception $e) {
             DB::rollBack();
             return response()->json([
                 'error'   => 'Error al crear documento de almacén (Venta)',
                 'message' => $e->getMessage()
             ], 500);
         }
     }
     
    public function showDetails($cod_documento, $seri_venta, $nume_venta)
    {
        try {
            // Llamar al procedimiento almacenado para obtener detalles de la venta
            // (incluye el ruc: la PK de ventas es compuesta y la misma serie/número
            // puede existir en otra empresa).
            $detalles = DB::select("CALL ObtenerDetallesVenta(?, ?, ?, ?)", [
                $cod_documento, $seri_venta, $nume_venta, auth()->user()->ruc
            ]);
            return response()->json($detalles);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener los detalles de la venta',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene las formas de pago de una venta específica.
     * 
     * URL: GET /api/ventas/formas-pago/{cod_documento}/{seri_venta}/{nume_venta}
     *
     * @param string $cod_documento
     * @param string $seri_venta
     * @param int $nume_venta
     * @return \Illuminate\Http\JsonResponse
     */
    public function showPaymentMethods($cod_documento, $seri_venta, $nume_venta)
    {
        try {
            // Llamar al procedimiento almacenado para obtener formas de pago
            // (incluye el ruc para no mezclar ventas de otra empresa)
            $formasPago = DB::select("CALL ObtenerFormasPagoVenta(?, ?, ?, ?)", [
                $cod_documento, $seri_venta, $nume_venta, auth()->user()->ruc
            ]);
            return response()->json($formasPago);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener las formas de pago',
                'message' => $e->getMessage()
            ], 500);
        }
    }

}
