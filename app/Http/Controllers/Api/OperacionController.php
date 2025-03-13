<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Operacion;

class OperacionController extends Controller
{
    /**
     * GET /api/operaciones
     * Retorna las operaciones activas (estado=1).
     */
    public function index()
    {
        try {
            // Si deseas todas, quita el where. Si quieres sólo activas:
            $operaciones = Operacion::where('estado', 1)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($operaciones);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener operaciones',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/operaciones
     * Crea una nueva operación.
     * Body JSON: { "descripcion": "...", "tipo_movimiento": "...", "cod_sunat": "...", ... }
     */
    public function store(Request $request)
    {
        $request->validate([
            'descripcion'     => 'required|string|max:200',
            'tipo_movimiento' => 'required|string|max:20', // 'INGRESO', 'SALIDA', etc.
            'cod_sunat'       => 'nullable|string|max:10',
            // si 'estado' se setea por defecto, no es obligatorio
        ]);

        try {
            $op = new Operacion();
            $op->descripcion     = $request->descripcion;
            $op->tipo_movimiento = $request->tipo_movimiento;
            $op->cod_sunat       = $request->cod_sunat ?: null;
            $op->estado          = 1;
            $op->created_at      = now();
            $op->updated_at      = now();
            $op->save();

            return response()->json([
                'success' => true,
                'message' => 'Operación creada correctamente',
                'id'      => $op->id
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al crear operación',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /api/operaciones/{id}
     * Muestra una operación específica.
     */
    public function show($id)
    {
        try {
            $op = Operacion::find($id);
            if (!$op || $op->estado == 0) {
                return response()->json(['error' => 'Operación no encontrada o inactiva'], 404);
            }
            return response()->json($op);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al obtener operación',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/operaciones/{id}
     * Actualiza los datos de una operación.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'descripcion'     => 'required|string|max:200',
            'tipo_movimiento' => 'required|string|max:20',
            'cod_sunat'       => 'nullable|string|max:10',
        ]);

        try {
            $op = Operacion::find($id);
            if (!$op || $op->estado == 0) {
                return response()->json(['error' => 'Operación no encontrada o inactiva'], 404);
            }

            $op->descripcion     = $request->descripcion;
            $op->tipo_movimiento = $request->tipo_movimiento;
            $op->cod_sunat       = $request->cod_sunat ?: null;
            $op->updated_at      = now();
            $op->save();

            return response()->json([
                'success' => true,
                'message' => 'Operación actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al actualizar operación',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/operaciones/{id}
     * Desactiva la operación (estado=0) en lugar de borrarla físicamente.
     */
    public function destroy($id)
    {
        try {
            $op = Operacion::find($id);
            if (!$op) {
                return response()->json(['error' => 'Operación no encontrada'], 404);
            }
            // Desactivamos
            $op->estado = 0;
            $op->updated_at = now();
            $op->save();

            return response()->json([
                'success' => true,
                'message' => 'Operación desactivada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al desactivar operación',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
