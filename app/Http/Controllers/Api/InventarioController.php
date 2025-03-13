<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventario;
use Illuminate\Http\Request;

class InventarioController extends Controller
{
    /**
     * GET /api/inventario
     * Devuelve el inventario con filtros:
     *   ?almacen_id=... (opcional)
     *   ?search=... (busca en nombre del artículo)
     */
    public function apiIndex(Request $request)
    {
        $almacenId = $request->query('almacen_id');
        $search    = $request->query('search');

        // Carga inventario con relaciones
        $query = Inventario::with(['almacen', 'articulo']);

        // Filtrar por almacen_id
        if ($almacenId) {
            $query->where('almacen_id', $almacenId);
        }

        // Filtrar por search => busca en articulo.nombrearticulo
        if ($search) {
            $searchLower = strtolower($search);
            $query->whereHas('articulo', function($q) use ($searchLower) {
                $q->whereRaw('LOWER(nombrearticulo) LIKE ?', ["%{$searchLower}%"]);
            });
        }

        $inventarios = $query->orderBy('id', 'desc')->get();

        return response()->json($inventarios);
    }
}
