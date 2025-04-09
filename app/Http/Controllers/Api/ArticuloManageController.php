<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Articulo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ArticuloManageController extends Controller
{
    // GET /api/articulos-manage
    public function index()
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $articulos = Articulo::where('ruc', $ruc)
            ->where('estado', 1)
            ->get();

        return response()->json($articulos);
    }

    // GET /api/articulos-manage/{codarticulo}
    public function show($codarticulo)
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $articulo = Articulo::where('codarticulo', $codarticulo)
            ->where('ruc', $ruc)
            ->first();

        if (!$articulo) {
            return response()->json(['message' => 'Artículo no encontrado'], 404);
        }

        return response()->json($articulo);
    }

    // POST /api/articulos-manage
    public function store(Request $request)
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $request->validate([
            'codarticulo'    => 'required|integer|unique:articulos,codarticulo',
            'codfamilia'     => 'required|string|max:6',
            'nombrearticulo' => 'required|string|max:200',
            'codsubfamilia'  => 'required|string|max:200',
            // etc. 
        ]);

        $articulo = new Articulo();
        $articulo->codarticulo    = $request->codarticulo;
        $articulo->codfamilia     = $request->codfamilia;
        $articulo->ruc            = $ruc;  // Asigna el RUC
        $articulo->codsubfamilia  = $request->codsubfamilia ?? null;
        $articulo->nombrearticulo = $request->nombrearticulo;
        $articulo->nombrecorto    = $request->nombrecorto ?? null;
        $articulo->stockminimo    = $request->stockminimo ?? 0;
        $articulo->stockmaximo    = $request->stockmaximo ?? 0;
        $articulo->tipoigv        = $request->tipoigv ?? 1;
        $articulo->codbarra       = $request->codbarra ?? null;
        $articulo->foto           = $request->foto ?? null;
        $articulo->codigosunat    = $request->codigosunat ?? null;
        $articulo->icbper         = $request->icbper ?? 0;
        $articulo->montoicbper    = $request->montoicbper ?? 0;
        $articulo->controlpeso    = $request->controlpeso ?? 0;
        $articulo->codartnue      = $request->codartnue ?? null;
        $articulo->estado         = 1;

        $articulo->save();

        return response()->json([
            'message' => 'Artículo creado correctamente',
            'data'    => $articulo
        ], 201);
    }

    // PUT/PATCH /api/articulos-manage/{codarticulo}
    public function update(Request $request, $codarticulo)
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $articulo = Articulo::where('codarticulo', $codarticulo)
            ->where('ruc', $ruc)
            ->first();

        if (!$articulo) {
            return response()->json(['message' => 'Artículo no encontrado'], 404);
        }

        // Valida campos
        $request->validate([
            'nombrearticulo' => 'required|string|max:200'
        ]);

        // Actualiza
        $articulo->nombrearticulo = $request->nombrearticulo;
        $articulo->nombrecorto    = $request->nombrecorto ?? $articulo->nombrecorto;
        $articulo->stockminimo    = $request->stockminimo ?? $articulo->stockminimo;
        $articulo->stockmaximo    = $request->stockmaximo ?? $articulo->stockmaximo;
        // ... etc.
        $articulo->save();

        return response()->json([
            'message' => 'Artículo actualizado correctamente',
            'data'    => $articulo
        ]);
    }

    // DELETE /api/articulos-manage/{codarticulo}
    // Cambia "estado" a 0
    public function destroy($codarticulo)
    {
        $user = Auth::user();
        $ruc  = $user->ruc ?? null;

        $articulo = Articulo::where('codarticulo', $codarticulo)
            ->where('ruc', $ruc)
            ->first();

        if (!$articulo) {
            return response()->json(['message' => 'Artículo no encontrado'], 404);
        }

        $articulo->estado = 0;
        $articulo->save();

        return response()->json([
            'message' => 'Artículo eliminado (estado=0) correctamente'
        ]);
    }
}

