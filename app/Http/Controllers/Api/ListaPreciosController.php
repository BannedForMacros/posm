<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ListaPreciosController extends Controller
{
    /**
     * GET /api/listaprecios
     * Obtiene todas las listas de precios del RUC del usuario logueado.
     */
    public function index(Request $request)
    {
        $user = $request->user(); // asumiendo user() tiene ->ruc
        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        try {
            // Llamamos al SP sp_obtenerListasPorRUC
            $listas = DB::select("CALL sp_obtenerListasPorRUC(?)", [$user->ruc]);
            return response()->json($listas);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener listas',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/listaprecios
     * Crea una nueva lista de precios con detalle.
     * Body: { "nombre": "...", "detalle": [ { "cod_articulo":..., "precio":... }, ... ] }
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'No autenticado'], 401);
        }

        $request->validate([
            'nombre' => 'required|string|max:100',
            'detalle' => 'required|array',
            'detalle.*.cod_articulo' => 'required|integer',
            'detalle.*.precio' => 'required|numeric'
        ]);

        try {
            DB::beginTransaction();

            // 1) Crear la lista
            $resultLista = DB::select("CALL sp_crearListaPrecios(?, ?)", [
                $user->ruc,
                $request->nombre
            ]);
            // sp_crearListaPrecios retorna SELECT LAST_INSERT_ID() AS id_creado
            $lista_id = $resultLista[0]->id_creado ?? null;

            // 2) Crear detalle
            foreach ($request->detalle as $item) {
                DB::statement("CALL sp_crearDetalleListaPrecios(?, ?, ?)", [
                    $lista_id,
                    $item['cod_articulo'],
                    $item['precio']
                ]);
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Lista de precios creada',
                'id'      => $lista_id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al crear lista',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/listaprecios/detalle/{id}
     * Retorna el detalle de una lista (sp_obtenerDetalleListaPrecios).
     */
    public function showDetalle($id)
    {
        try {
            $detalle = DB::select("CALL sp_obtenerDetalleListaPrecios(?)", [$id]);
            return response()->json($detalle);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener detalle',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/listaprecios/detalle/{id}
     * Actualiza precios (ejemplo en masa).
     * Body: [ { "id":..., "precio":... }, ... ]
     * O podrías usar sp_editarDetalleListaPrecios por cada item.
     */
    public function updateDetalle(Request $request, $id)
    {
        $request->validate([
            '*.id' => 'required|integer',
            '*.precio' => 'required|numeric'
        ]);

        try {
            DB::beginTransaction();
            // Ejemplo: iterar y llamar sp_editarDetalleListaPrecios
            foreach ($request->all() as $item) {
                DB::statement("CALL sp_editarDetalleListaPrecios(?, ?)", [
                    $item['id'],
                    $item['precio']
                ]);
            }
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Detalle actualizado'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al actualizar detalle',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/listaprecios/desactivar/{id}
     * Desactiva la lista (estado=0).
     */
    public function desactivar($id)
    {
        try {
            DB::statement("CALL sp_desactivarListaPrecios(?)", [$id]);
            return response()->json([
                'success' => true,
                'message' => 'Lista desactivada'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al desactivar lista',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
