<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Familia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FamiliaController extends Controller
{
    // GET /api/familias
    public function index()
    {
        // Opcionalmente, filtra por RUC del usuario autenticado
        // Asumiendo que en la tabla users existe un campo 'ruc' y 
        // en tu modelo User has -> ruc
        $user = Auth::user();  // si usas Sanctum o Session
        $ruc  = $user->ruc ?? null;

        // Obtiene solo las familias de este RUC (estado=1 => activas)
        $familias = Familia::where('ruc', $ruc)
            ->where('estado', 1)
            ->get();

        return response()->json($familias);
    }

    // GET /api/familias/{codfamilia}
    public function show($codfamilia)
    {
        // Opcionalmente, validamos que sea del RUC del usuario
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $familia = Familia::where('codfamilia', $codfamilia)
            ->where('ruc', $ruc)
            ->first();

        if (!$familia) {
            return response()->json(['message' => 'Familia no encontrada'], 404);
        }

        return response()->json($familia);
    }

    // POST /api/familias
    public function store(Request $request)
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        // Validar los campos
        $request->validate([
            'codfamilia'  => 'required|string|max:6|unique:familia,codfamilia',
            'familia'     => 'required|string|max:200',
            'subfamilia'  => 'nullable|string|max:200',
        ], [
            // Usamos $request->input('codfamilia') para obtener el valor ingresado
            'codfamilia.unique' => 'El código de familia (' . $request->input('codfamilia') . ') que has introducido ya existe.',            
            'codfamilia.required' => 'El campo código de la familia es obligatorio.',
            'familia.required' => 'El campo familia es obligatorio.',
            'familia.string' => 'El campo familia debe ser una cadena de texto.',
            'familia.max' => 'El campo familia no puede tener más de 200 caracteres.',
        ]);

        $familia = new Familia();
        $familia->codfamilia = $request->codfamilia; 
        $familia->ruc        = $ruc;  // Asigna el RUC del usuario autenticado
        $familia->familia    = $request->familia;
        $familia->subfamilia = $request->subfamilia ?? null;
        $familia->estado     = 1;     // activa

        $familia->save();

        return response()->json([
            'message' => 'Familia creada correctamente',
            'data'    => $familia
        ], 201);
    }

    // PUT/PATCH /api/familias/{codfamilia}
    public function update(Request $request, $codfamilia)
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $familia = Familia::where('codfamilia', $codfamilia)
            ->where('ruc', $ruc)
            ->first();

        if (!$familia) {
            return response()->json(['message' => 'Familia no encontrada'], 404);
        }

        $request->validate([
            'familia'    => 'required|string|max:200',
            'subfamilia' => 'nullable|string|max:200',
        ]);

        $familia->familia    = $request->familia;
        $familia->subfamilia = $request->subfamilia ?? null;

        $familia->save();

        return response()->json([
            'message' => 'Familia actualizada correctamente',
            'data'    => $familia
        ]);
    }

    // DELETE /api/familias/{codfamilia}
    // Para “borrar” sólo cambia estado a 0
    public function destroy($codfamilia)
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $familia = Familia::where('codfamilia', $codfamilia)
            ->where('ruc', $ruc)
            ->first();

        if (!$familia) {
            return response()->json(['message' => 'Familia no encontrada'], 404);
        }

        $familia->estado = 0;
        $familia->save();

        return response()->json([
            'message' => 'Familia eliminada (estado=0) correctamente'
        ]);
    }
}
