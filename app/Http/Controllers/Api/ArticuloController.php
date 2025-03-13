<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class ArticuloController extends Controller
{
    /**
     * Devuelve la lista de artículos utilizando el procedimiento almacenado.
     *
     * URL: /api/articulos
     */
    public function index(Request $request)
    {
        try {
            // 1) Obtener el usuario autenticado
            $user = $request->user(); // o auth()->user()
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }

            $rucUsuario = $user->ruc;

            // 2) Llamar al procedimiento almacenado con el ruc, 
            //    o hacer una consulta directa filtrando por 'ruc = $rucUsuario'.

            // EJEMPLO A: Usando un SP que filtra por RUC
            // $articulos = DB::select("CALL ObtenerArticulosPorRuc(?)", [$rucUsuario]);

            // EJEMPLO B: Consulta directa (si no usas SP):
            $articulos = DB::table('articulos')
                ->where('ruc', $rucUsuario)
                ->get();

            return response()->json($articulos);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener los artículos',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    

    /**
     * Devuelve el detalle de un artículo en base a su ID utilizando un procedimiento almacenado.
     *
     * URL: /api/articulos/{id}
     */
    public function show($id)
    {
        try {
            // Llamada al procedimiento almacenado para obtener el detalle del artículo.
            $resultado = DB::select("CALL ObtenerArticuloDetalle(?)", [$id]);
            if (empty($resultado)) {
                return response()->json(['message' => 'Artículo no encontrado'], 404);
            }
            return response()->json($resultado[0]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener el artículo',
                'message' => $e->getMessage()
            ], 500);
        }
    }


     /**
     * GET /api/articulos-con-movimientos
     * Retorna todos los artículos con sus detalles de almacén.
     * Opcional: filtra por almacén (almacen_id).
     */
    public function articulosConMovimientos(Request $request)
    {
        $almacenId = $request->query('almacen_id');

        // Construimos la query para cargar:
        // - warehouseDetails (los movimientos)
        // - dentro de cada detail, el warehouseDocument (para ver fecha, tipo_movimiento, etc.)
        $query = Articulo::with([
            'warehouseDetails.warehouseDocument' => function($q) use ($almacenId) {
                // Si se pasó un almacen_id, filtramos
                if ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                }
            }
        ]);

        // Podrías filtrar artículos activos, etc., si deseas
        // $query->where('estado', 1);

        $articulos = $query->get();

        return response()->json($articulos);
    }
}
