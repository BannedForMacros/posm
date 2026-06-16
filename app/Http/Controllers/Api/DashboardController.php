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

        // Todas las métricas se filtran por la empresa del usuario autenticado
        $ruc = $request->user()->ruc;

        try {
            // 1) Estadísticas Generales (clientes únicos)
            $stats = DB::selectOne("
                SELECT
                    COALESCE(SUM(\"TOTAL_VENTA\"), 0) AS total_ventas,
                    COUNT(*) AS total_transacciones,
                    COALESCE(AVG(\"TOTAL_VENTA\"), 0) AS promedio_venta,

                    -- Contar clientes únicos
                    COUNT(
                      DISTINCT CASE
                        WHEN \"TIPODOCUMENTOCLI\" IN ('RUC','DNI','CE','PAS')
                          THEN \"NUMERODOCUMENTOCLI\"
                        ELSE \"RAZONSOCIALCLI\"
                      END
                    ) AS clientes_unicos

                FROM ventas
                WHERE
                    \"RUCEMPRESA\" = ?
                    AND (?::int IS NULL OR EXTRACT(MONTH FROM femi_to_date(\"FEMI_VENTA\"))::int = ?::int)
                    AND (?::int IS NULL OR EXTRACT(YEAR  FROM femi_to_date(\"FEMI_VENTA\"))::int = ?::int)
            ", [$ruc, $mes, $mes, $anio, $anio]);

            // 2) Ventas por Día
            $ventasPorDia = DB::select("SELECT * FROM \"sp_GraficaVentasPorDia\"(?, ?, ?)", [$mes, $anio, $ruc]);

            // 3) Ventas por Forma de Pago
            $ventasPorFormaPago = DB::select("SELECT * FROM \"sp_GraficaVentasPorFormaPago\"(?, ?, ?)", [$mes, $anio, $ruc]);

            // 4) Ventas por Artículo
            $ventasPorArticulo = DB::select("SELECT * FROM \"sp_GraficaVentasPorArticulo\"(?, ?, ?)", [$mes, $anio, $ruc]);

            // 5) Top Artículos
            $topArticulos = DB::select("SELECT * FROM \"sp_GraficaTopArticulos\"(?, ?, ?, ?)", [$mes, $anio, $limite, $ruc]);

            // 6) Ventas por Sucursal (nuevo)
            $ventasPorSucursal = DB::select("SELECT * FROM \"sp_GraficaVentasPorSucursal\"(?, ?, ?)", [$mes, $anio, $ruc]);

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
