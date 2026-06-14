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
            'detalle.*.cod_unidad'   => 'nullable|integer',
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
            if (!$lista_id) {
                // Aborta la transacción: sin cabecera no se pueden insertar detalles
                throw new \Exception('No se pudo crear la cabecera de la lista de precios.');
            }

            // 2) Crear detalle — el SP requiere 4 parámetros:
            //    (lista_id, cod_articulo, cod_unidad, precio).
            //    Si el frontend no envía unidad, se usa 1 = "unidad".
            foreach ($request->detalle as $item) {
                DB::statement("CALL sp_crearDetalleListaPrecios(?, ?, ?, ?)", [
                    $lista_id,
                    $item['cod_articulo'],
                    $item['cod_unidad'] ?? 1,
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
    /**
     * Verifica que la lista de precios pertenezca a la empresa del usuario autenticado.
     */
    private function perteneceAlUsuario($id): bool
    {
        return DB::table('lista_precios')
            ->where('id', $id)
            ->where('ruc', auth()->user()->ruc)
            ->exists();
    }

    public function showDetalle($id)
    {
        if (!$this->perteneceAlUsuario($id)) {
            return response()->json(['error' => 'Lista no encontrada'], 404);
        }

        try {
            // Llamamos al SP para obtener el detalle de la lista
            $detalle = DB::select("CALL sp_obtenerDetalleListaPrecios(?)", [$id]);
            
            // Realizamos una consulta adicional para obtener el nombre real de la lista
            $lista = DB::table('lista_precios')->where('id', $id)->first();
            
            // Si se encuentra el registro, obtenemos su nombre; de lo contrario, usamos un fallback
            $nombre_lista = $lista && isset($lista->nombre)
                ? $lista->nombre
                : "Lista #".$id;
                
            // Retornamos un objeto que contiene el nombre y el detalle
            return response()->json([
                'nombre_lista' => $nombre_lista,
                'detalle' => $detalle
            ]);
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
        // El SP identifica cada fila por (lista_id, cod_articulo, cod_unidad)
        $request->validate([
            '*.cod_articulo' => 'required|integer',
            '*.cod_unidad'   => 'required|integer',
            '*.precio'       => 'required|numeric'
        ]);

        if (!$this->perteneceAlUsuario($id)) {
            return response()->json(['error' => 'Lista no encontrada'], 404);
        }

        try {
            DB::beginTransaction();
            foreach ($request->all() as $item) {
                DB::statement("CALL sp_editarDetalleListaPrecios(?, ?, ?, ?)", [
                    $id,
                    $item['cod_articulo'],
                    $item['cod_unidad'],
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
        if (!$this->perteneceAlUsuario($id)) {
            return response()->json(['error' => 'Lista no encontrada'], 404);
        }

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
