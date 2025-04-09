<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Articulo;
use App\Models\Familia;

class ArticuloController extends Controller
{
    public function index(Request $request)
    {
        try {
            // 1) Obtener usuario
            $user = $request->user();
            if (!$user) {
                return redirect()->route('login');
            }

            // 2) Filtrar por ruc
            $rucUsuario = $user->ruc;

            // 3) Obtener artículos con la relación familia
            $articulos = Articulo::with('familia')
                ->where('ruc', $rucUsuario)
                ->get();

            // 4) Obtener familias
            $familias = Familia::where('ruc', $rucUsuario)->get();

            // IMPORTANTE: No pongas 'return response()->json(...)' aquí,
            // porque corta la ejecución y no llega al Inertia::render.

            // 5) Retornar la vista con Inertia
            return Inertia::render('ArticulosManage/Index', [
                'articulos' => $articulos,
                'familias'  => $familias,
            ]);

        } catch (\Exception $e) {
            // Manejo de error
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
<<<<<<< HEAD
=======


>>>>>>> 0534e466fbc86a6fcd308a81f78de42db62daf18

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
