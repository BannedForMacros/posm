<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SerieDocumento;
use App\Support\TipoComprobante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SerieDocumentoController extends Controller
{
    // GET /api/ventas/series?cod_documento=03 → series activas con su siguiente correlativo
    public function index(Request $request): JsonResponse
    {
        $request->validate(['cod_documento' => ['required', Rule::in(TipoComprobante::codigos())]],
            ['cod_documento.in' => 'Tipo de comprobante no válido.']);

        $ruc = $request->user()->ruc;
        $cod = $request->cod_documento;

        $series = SerieDocumento::activas($ruc, $cod)->get()->map(fn (SerieDocumento $s) => [
            'serie' => $s->serie,
            'siguiente' => SerieDocumento::siguienteCorrelativo($ruc, $cod, $s->serie),
        ]);

        return response()->json($series);
    }

    // POST /api/ventas/series { cod_documento, serie }
    public function store(Request $request): JsonResponse
    {
        $ruc = $request->user()->ruc;
        $request->merge(['serie' => TipoComprobante::normalizarSerie($request->serie)]);

        $datos = $request->validate([
            'cod_documento' => ['required', Rule::in(TipoComprobante::codigos())],
            'serie' => [
                'required', 'string', 'max:4',
                Rule::unique('series_documento', 'serie')->where('ruc', $ruc)->where('cod_documento', $request->cod_documento),
            ],
        ], [
            'cod_documento.in' => 'Tipo de comprobante no válido.',
            'serie.required' => 'Escribe la serie.',
            'serie.max' => 'La serie tiene como máximo 4 caracteres.',
            'serie.unique' => 'Esa serie ya existe para este comprobante.',
        ]);

        if (! TipoComprobante::serieValida($datos['cod_documento'], $datos['serie'])) {
            $msg = TipoComprobante::errorSerie($datos['cod_documento']);

            return response()->json(['message' => $msg, 'errors' => ['serie' => [$msg]]], 422);
        }

        $serie = SerieDocumento::create([...$datos, 'ruc' => $ruc, 'estado' => true]);

        return response()->json([
            'message' => "Serie {$serie->serie} creada",
            'data' => [
                'serie' => $serie->serie,
                'siguiente' => SerieDocumento::siguienteCorrelativo($ruc, $serie->cod_documento, $serie->serie),
            ],
        ], 201);
    }
}
