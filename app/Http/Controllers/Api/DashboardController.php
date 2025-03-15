<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Endpoint para el Dashboard:
     * Retorna:
     *  - stats (con clientes únicos usando TIPODOCUMENTOCLI / RAZONSOCIALCLI)
     *  - ventasPorDia
     *  - ventasPorFormaPago
     *  - ventasPorArticulo
     *  - topArticulos
     *  - ventasPorSucursal (nuevo)
     */
    public function dashboardGraficos(Request $request)
    {
        $mes    = $request->input('mes');
        $anio   = $request->input('anio');
        $limite = $request->input('limite', 5); // Para "Top Artículos"

        try {
            // 1) Estadísticas Generales (clientes únicos)
            $stats = DB::selectOne("
                SELECT
                    IFNULL(SUM(TOTAL_VENTA), 0) AS total_ventas,
                    COUNT(*) AS total_transacciones,
                    IFNULL(AVG(TOTAL_VENTA), 0) AS promedio_venta,
                    
                    -- Contar clientes únicos
                    COUNT(
                      DISTINCT CASE
                        WHEN TIPODOCUMENTOCLI IN ('RUC','DNI','CE','PAS')
                          THEN NUMERODOCUMENTOCLI
                        ELSE RAZONSOCIALCLI
                      END
                    ) AS clientes_unicos
                    
                FROM ventas
                WHERE
                    (? IS NULL OR MONTH(FEMI_VENTA) = ?)
                    AND (? IS NULL OR YEAR(FEMI_VENTA) = ?)
            ", [$mes, $mes, $anio, $anio]);

            // 2) Ventas por Día
            $ventasPorDia = DB::select("CALL sp_GraficaVentasPorDia(?, ?)", [$mes, $anio]);

            // 3) Ventas por Forma de Pago
            $ventasPorFormaPago = DB::select("CALL sp_GraficaVentasPorFormaPago(?, ?)", [$mes, $anio]);

            // 4) Ventas por Artículo
            $ventasPorArticulo = DB::select("CALL sp_GraficaVentasPorArticulo(?, ?)", [$mes, $anio]);

            // 5) Top Artículos
            $topArticulos = DB::select("CALL sp_GraficaTopArticulos(?, ?, ?)", [$mes, $anio, $limite]);

            // 6) Ventas por Sucursal (nuevo)
            $ventasPorSucursal = DB::select("CALL sp_GraficaVentasPorSucursal(?, ?)", [$mes, $anio]);

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'total_ventas'       => (float) $stats->total_ventas,
                        'total_transacciones'=> (int)   $stats->total_transacciones,
                        'promedio_venta'     => (float) $stats->promedio_venta,
                        'clientes_unicos'    => (int)   $stats->clientes_unicos
                    ],
                    'ventasPorDia'       => $ventasPorDia,
                    'ventasPorFormaPago' => $ventasPorFormaPago,
                    'ventasPorArticulo'  => $ventasPorArticulo,
                    'topArticulos'       => $topArticulos,

                    // Devolvemos la nueva propiedad
                    'ventasPorSucursal'  => $ventasPorSucursal
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar datos de las gráficas',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
