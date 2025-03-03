<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

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
    public function showDetails($cod_documento, $seri_venta, $nume_venta)
    {
        try {
            // Llamar al procedimiento almacenado para obtener detalles de la venta
            $detalles = DB::select("CALL ObtenerDetallesVenta(?, ?, ?)", [
                $cod_documento, $seri_venta, $nume_venta
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
            $formasPago = DB::select("CALL ObtenerFormasPagoVenta(?, ?, ?)", [
                $cod_documento, $seri_venta, $nume_venta
            ]);
            return response()->json($formasPago);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener las formas de pago',
                'message' => $e->getMessage()
            ], 500);
        }
    }
// 1) Definir un método en tu controlador
public function graficaVentasPorDia(Request $request)
{
    $mes = $request->input('mes');
    $anio = $request->input('anio');

    try {
        $resultado = DB::select("CALL sp_GraficaVentasPorDia(?, ?)", [$mes, $anio]);
        return response()->json($resultado);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Error al obtener datos de ventas por día',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function graficaVentasPorFormaPago(Request $request)
{
    $mes = $request->input('mes');
    $anio = $request->input('anio');

    try {
        $resultado = DB::select("CALL sp_GraficaVentasPorFormaPago(?, ?)", [$mes, $anio]);
        return response()->json($resultado);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Error al obtener datos de ventas por forma de pago',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function graficaVentasPorArticulo(Request $request)
{
    $mes = $request->input('mes');
    $anio = $request->input('anio');

    try {
        $resultado = DB::select("CALL sp_GraficaVentasPorArticulo(?, ?)", [$mes, $anio]);
        return response()->json($resultado);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Error al obtener datos de ventas por artículo',
            'message' => $e->getMessage()
        ], 500);
    }
}

public function graficaTopArticulos(Request $request)
{
    $mes     = $request->input('mes');
    $anio    = $request->input('anio');
    // Definir un límite. Si no llega, podrías poner un valor por defecto, p. ej. 5.
    $limite  = $request->input('limite', 5);

    try {
        $resultado = DB::select("CALL sp_GraficaTopArticulos(?, ?, ?)", [
            $mes,
            $anio,
            $limite
        ]);
        return response()->json($resultado);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Error al obtener top de artículos vendidos',
            'message' => $e->getMessage()
        ], 500);
    }
}
public function estadisticasGenerales(Request $request)
{
    $mes = $request->input('mes');
    $anio = $request->input('anio');

    try {
        // Aquí hacemos una consulta directa (o podrías crear un SP aparte).
        // Ejemplo: total ventas, transacciones, promedio, clientes únicos
        // Ajusta nombres de columna si son diferentes en tu DB.
        $stats = DB::selectOne("
            SELECT
                IFNULL(SUM(TOTAL_VENTA), 0) AS total_ventas,
                COUNT(*) AS total_transacciones,
                IFNULL(AVG(TOTAL_VENTA), 0) AS promedio_venta,
                COUNT(DISTINCT ID_CLIENTE) AS clientes_unicos
            FROM ventas
            WHERE
                (? IS NULL OR MONTH(FEMI_VENTA) = ?)
                AND (? IS NULL OR YEAR(FEMI_VENTA) = ?)
        ", [$mes, $mes, $anio, $anio]);

        // Devolvemos un objeto con los campos para las tarjetas
        return response()->json([
            'total_ventas'       => (float) $stats->total_ventas,
            'total_transacciones'=> (int)   $stats->total_transacciones,
            'promedio_venta'     => (float) $stats->promedio_venta,
            'clientes_unicos'    => (int)   $stats->clientes_unicos
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Error al obtener estadísticas generales',
            'message' => $e->getMessage()
        ], 500);
    }
}
public function getDetalleCompleto($cod_documento, $seri_venta, $nume_venta)
{
    try {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Usuario no autorizado'], 401);
        }

        // Obtener detalles
        $detalles = DB::select("CALL ObtenerDetallesVenta(?, ?, ?)", [
            $cod_documento, $seri_venta, $nume_venta
        ]);

        // Obtener formas de pago
        $formasPago = DB::select("CALL ObtenerFormasPagoVenta(?, ?, ?)", [
            $cod_documento, $seri_venta, $nume_venta
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'detalles' => $detalles,
                'formasPago' => $formasPago
            ]
        ]);

    } catch (\Exception $e) {
        \Log::error("Error en getDetalleCompleto: " . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener los detalles de la venta',
            'error' => $e->getMessage()
        ], 500);
    }
}
}
