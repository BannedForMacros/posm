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
    public function index()
    {
        try {
            // Llamada al procedimiento almacenado para obtener todos los artículos.
            $articulos = DB::select("CALL ObtenerArticulos()");
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
}
