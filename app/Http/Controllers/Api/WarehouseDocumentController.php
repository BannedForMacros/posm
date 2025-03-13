<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WarehouseDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WarehouseDocumentController extends Controller
{
    // GET /api/warehouse-documents
    public function index()
    {
        try {
            Log::info('Iniciando obtención de documentos de almacén con relaciones operacion y user');
            
            $warehouseDocuments = WarehouseDocument::with(['operacion', 'user'])
                ->orderBy('fecha', 'desc')
                ->get();
            
            Log::info('Documentos obtenidos', ['cantidad' => $warehouseDocuments->count()]);
            
            return response()->json($warehouseDocuments);
        } catch (\Exception $e) {
            Log::error('Error al obtener documentos de almacén', ['error' => $e->getMessage()]);
            
            return response()->json([
                'error'   => 'Error al obtener documentos de almacén',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/warehouse-documents/{id}
// app/Http/Controllers/Api/WarehouseDocumentController.php

public function show($id)
{
    try {
        // Usamos Eloquent con las relaciones:
        // 'almacen', 'user', 'operacion', 'facturacion', 'venta', y 'detalles.articulo'
        $doc = \App\Models\WarehouseDocument::with([
            'almacen',
            'user',
            'operacion',
            'facturacion',
            'venta',            // si tienes la relación "public function venta() { ... }" en el modelo
            'detalles.articulo' // para mostrar el nombre del artículo
        ])->findOrFail($id);

        return response()->json($doc);
    } catch (\Exception $e) {
        return response()->json([
            'error'   => 'Error al obtener el documento de almacén',
            'message' => $e->getMessage()
        ], 500);
    }
}

}
