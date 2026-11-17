<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Services\ConsultaDocumentoService;
use App\Support\DocumentoIdentidad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class ClienteController extends Controller
{
    /**
     * GET /api/clientes/buscar?documento=20100070970
     *
     * 1) Si el cliente ya está guardado en la empresa, devuelve esos datos (fuente "local").
     * 2) Si no, consulta SUNAT/RENIEC en la API de DBPeru (fuente "consulta"). Se guarda al registrar la venta.
     */
    public function buscar(Request $request, ConsultaDocumentoService $consulta): JsonResponse
    {
        $numero = DocumentoIdentidad::limpiar($request->query('documento'));
        if ($error = DocumentoIdentidad::error($numero)) {
            return response()->json(['message' => $error, 'errors' => ['documento' => [$error]]], 422);
        }

        $cliente = Cliente::deEmpresa($request->user()->ruc)->where('numero_documento', $numero)->first();
        if ($cliente) {
            return response()->json(['fuente' => 'local', 'cliente' => $this->formato($cliente->toArray())]);
        }

        try {
            $datos = $consulta->consultar($numero);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'manual' => true], 503);
        }

        if (! $datos) {
            $tipo = strlen($numero) === 11 ? 'RUC' : 'DNI';

            return response()->json(['message' => "No se encontró el {$tipo} {$numero}. Ingresa los datos manualmente.", 'manual' => true], 404);
        }

        return response()->json(['fuente' => 'consulta', 'cliente' => $this->formato($datos)]);
    }

    private function formato(array $c): array
    {
        return [
            'tipo_documento' => $c['tipo_documento'],
            'numero_documento' => $c['numero_documento'],
            'razon_social' => $c['razon_social'],
            'direccion' => $c['direccion'] ?? null,
            'correo' => $c['correo'] ?? null,
            'estado' => $c['estado'] ?? null,
            'condicion' => $c['condicion'] ?? null,
        ];
    }
}
