<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TipoDocumentoController extends Controller
{
    /**
     * Retorna la lista de tipos de documento.
     */
    public function index()
    {
        try {
            // Se obtienen sólo los registros activos
            $tipoDocumentos = DB::table('tipo_documento')
                ->select('id', 'descripcion')
                ->where('estado', 1)
                ->orderBy('descripcion', 'asc')
                ->get();

            return response()->json($tipoDocumentos, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener tipos de documento',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
