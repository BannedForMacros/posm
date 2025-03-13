<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WarehouseDocumentDetail;

class WarehouseDocumentDetailController extends Controller
{
    /**
     * GET /api/warehouse-movements
     * Retorna todos los detalles de almacén (movimientos),
     * filtrando por almacen_id y product_id si se pasan ?almacen_id=... &product_id=...
     */
    public function movementsIndex(Request $request)
    {
        \Log::info('Entrando a movementsIndex...');
    
        $almacenId = $request->query('almacen_id');
        $productId = $request->query('product_id');
    
        try {
            // Carga la relación con warehouseDocument (almacen, operacion, user) y articulo
            $query = WarehouseDocumentDetail::with([
                'warehouseDocument.almacen',
                'warehouseDocument.operacion',
                'warehouseDocument.user',
                'articulo'
            ]);
    
            // Filtro por almacén
            if ($almacenId) {
                $query->whereHas('warehouseDocument', function($q) use ($almacenId) {
                    $q->where('almacen_id', $almacenId);
                });
            }
    
            // Filtro por producto (cod_articulo)
            if ($productId) {
                $query->where('cod_articulo', $productId);
            }
    
            // Orden descendente
            $movements = $query->orderBy('id', 'desc')->get();
    
            \Log::info('Movimientos obtenidos: ' . count($movements));
    
            return response()->json($movements, 200);
        } catch (\Exception $e) {
            \Log::error('Error en movementsIndex: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Error al obtener movimientos',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
}
