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


     // Tasa de IGV (Perú). Los precios unitarios que ingresa el cajero
     // se interpretan como precio CON IGV incluido (boleta/factura).
     private const TASA_IGV = 18.0;

     public function store(Request $request)
     {
         $request->validate([
             'cod_documento'        => 'required|string|max:2',
             'seri_venta'           => 'required|string|max:20',
             // Si no se envía, se autogenera el siguiente correlativo de la serie
             'nume_venta'           => 'nullable|string|max:20',
             'almacen_id'           => 'required|integer',
             'fecha'                => 'required|date',

             // Datos del cliente (manuales en este formulario)
             'cliente_nombre'       => 'required|string|max:150',
             'cliente_documento'    => 'nullable|string|max:150',

             // Detalles
             'detalles'                         => 'required|array|min:1',
             'detalles.*.cod_articulo'          => 'required|integer',
             'detalles.*.cantidad'              => 'required|numeric|gt:0',
             'detalles.*.precio_unitario'       => 'required|numeric|gte:0',
         ]);

         // Usuario actual
         $user = $request->user();
         if (!$user) {
             return response()->json(['error' => 'Usuario no autenticado'], 401);
         }

         // Asignamos su RUC
         $rucUsuario = $user->ruc;
         if (!$rucUsuario) {
             return response()->json([
                 'error' => 'El usuario no tiene un RUC asignado; no se puede registrar la venta.'
             ], 422);
         }

         $codDocumento = $request->cod_documento;
         $seriVenta    = $request->seri_venta;
         // Fecha de emisión en formato Y-m-d (el dashboard la parsea con STR_TO_DATE)
         $femiVenta    = Carbon::parse($request->fecha)->format('Y-m-d');

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

             // 1) Determinar el correlativo (NUME_VENTA).
             //    Si el cajero lo escribió, se valida que no exista ya;
             //    si lo dejó vacío, se autogenera el siguiente de la serie.
             if ($request->filled('nume_venta')) {
                 $numeVenta = $request->nume_venta;
                 $yaExiste = DB::table('ventas')
                     ->where('RUCEMPRESA', $rucUsuario)
                     ->where('COD_DOCUMENTO', $codDocumento)
                     ->where('SERI_VENTA', $seriVenta)
                     ->where('NUME_VENTA', $numeVenta)
                     ->exists();
                 if ($yaExiste) {
                     DB::rollBack();
                     return response()->json([
                         'error' => "Ya existe una venta {$codDocumento}-{$seriVenta}-{$numeVenta}."
                     ], 422);
                 }
             } else {
                 $ultimo = DB::table('ventas')
                     ->where('RUCEMPRESA', $rucUsuario)
                     ->where('COD_DOCUMENTO', $codDocumento)
                     ->where('SERI_VENTA', $seriVenta)
                     ->max(DB::raw('CAST(NUME_VENTA AS UNSIGNED)'));
                 $numeVenta = str_pad(((int) $ultimo) + 1, 8, '0', STR_PAD_LEFT);
             }

             // 2) Calcular totales de la venta (IGV incluido en el precio unitario)
             $factor      = 1 + (self::TASA_IGV / 100);
             $totalVenta  = 0.0;  // total con IGV
             $netoVenta   = 0.0;  // valor de venta sin IGV
             $igvVenta    = 0.0;  // IGV total
             $lineas      = [];

             foreach ($request->detalles as $i => $det) {
                 $cantidad   = (float) $det['cantidad'];
                 $precioUnit = (float) $det['precio_unitario']; // con IGV
                 $totalLinea = round($cantidad * $precioUnit, 2);
                 $netoUnit   = round($precioUnit / $factor, 4);   // neto unitario
                 $netoLinea  = round($netoUnit * $cantidad, 4);
                 $igvLinea   = round($totalLinea - $netoLinea, 4);

                 $totalVenta += $totalLinea;
                 $netoVenta  += $netoLinea;
                 $igvVenta   += $igvLinea;

                 $lineas[] = [
                     'idx'         => $i + 1,
                     'cod'         => $det['cod_articulo'],
                     'cantidad'    => $cantidad,
                     'precio_unit' => $precioUnit,
                     'neto_unit'   => $netoUnit,
                     'igv_linea'   => $igvLinea,
                     'total_linea' => $totalLinea,
                 ];
             }

             // 3) Inferir el tipo de documento del cliente por longitud
             $docCli = trim((string) $request->cliente_documento);
             $tipoDocCli = strlen($docCli) === 11 ? 'RUC'
                         : (strlen($docCli) === 8 ? 'DNI' : '');

             // 4) Insertar la cabecera en `ventas`
             DB::table('ventas')->insert([
                 'COD_DOCUMENTO'      => $codDocumento,
                 'SERI_VENTA'         => $seriVenta,
                 'NUME_VENTA'         => $numeVenta,
                 'RUCEMPRESA'         => $rucUsuario,
                 'FEMI_VENTA'         => $femiVenta,
                 'TNETO_VENTA'        => round($netoVenta, 2),
                 'TDES_VENTA'         => 0,
                 'IMPU_VENTA'         => round($igvVenta, 2),
                 'TOTAL_VENTA'        => round($totalVenta, 2),
                 'TCAMB_VENTA'        => 1,
                 'ESTA_VENTA'         => 1,
                 'fec_crea'           => now(),
                 'CREA_USUARIO'       => $user->name,
                 'TIPODOCUMENTOCLI'   => $tipoDocCli,
                 'NUMERODOCUMENTOCLI' => $docCli,
                 'RAZONSOCIALCLI'     => $request->cliente_nombre,
                 'CODALMACEN'         => (string) $request->almacen_id,
             ]);

             // 5) Insertar los detalles en `ventasdetalle`
             foreach ($lineas as $linea) {
                 DB::table('ventasdetalle')->insert([
                     'COD_DOCUMENTO'  => $codDocumento,
                     'SERI_VENTA'     => $seriVenta,
                     'NUME_VENTA'     => $numeVenta,
                     'ID_VENTASD'     => $linea['idx'],
                     'COD_ARTICULO'   => $linea['cod'],
                     'COD_UNIDADM'    => 1, // unidad por defecto
                     'CANT_VENTASD'   => $linea['cantidad'],
                     'PUNI_VENTASD'   => $linea['precio_unit'],
                     'IMPU_VENTASD'   => $linea['igv_linea'],
                     'TNETO_VENTASD'  => $linea['neto_unit'],
                     'TDESC_VENTASD'  => 0,
                     'TIMP_VENTASD'   => $linea['total_linea'],
                     'ESTA_VENTASD'   => '1',
                     'TIP_IGV'        => 1,
                     'TASA_IMP'       => self::TASA_IGV,
                     'FEC_CREA'       => now(),
                     'CREA_USUARIO'   => $user->name,
                 ]);
             }

             // 6) Crear la cabecera del documento de almacén (movimiento de salida)
             $warehouseDoc = new WarehouseDocument();
             $warehouseDoc->ruc             = $rucUsuario;
             $warehouseDoc->almacen_id      = $request->almacen_id;
             $warehouseDoc->facturacion_id  = null;
             $warehouseDoc->venta_id        = null; // ventas no tiene PK simple `id`
             $warehouseDoc->user_id         = $user->id;
             $warehouseDoc->operacion_id    = 2; // 2 = Venta
             $warehouseDoc->tipo_movimiento = 'SALIDA';
             $warehouseDoc->fecha           = $request->fecha;
             $warehouseDoc->estado          = 1;
             $warehouseDoc->created_at      = now();
             $warehouseDoc->updated_at      = now();
             $warehouseDoc->save();

             // 7) Detalles del documento de almacén + descuento de inventario
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

                 // Restar stock (ya validado arriba que existe y alcanza)
                 $invent = DB::table('inventario')
                     ->where('ruc', $rucUsuario)
                     ->where('almacen_id', $request->almacen_id)
                     ->where('cod_articulo', $det['cod_articulo'])
                     ->first();

                 DB::table('inventario')
                     ->where('id', $invent->id)
                     ->update([
                         'stock'      => $invent->stock - $det['cantidad'],
                         'updated_at' => now()
                     ]);
             }

             DB::commit();
             return response()->json([
                 'success' => true,
                 'message' => "Venta {$codDocumento}-{$seriVenta}-{$numeVenta} registrada correctamente",
                 'venta'   => [
                     'cod_documento' => $codDocumento,
                     'seri_venta'    => $seriVenta,
                     'nume_venta'    => $numeVenta,
                     'total_venta'   => round($totalVenta, 2),
                 ],
                 'warehouse_document_id' => $warehouseDoc->id
             ], 201);
     
         } catch (\Exception $e) {
             DB::rollBack();
             return response()->json([
                 'error'   => 'Error al registrar la venta',
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
