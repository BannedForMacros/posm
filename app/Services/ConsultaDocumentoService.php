<?php

namespace App\Services;

use App\Support\DocumentoIdentidad;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Consulta de RUC / DNI en la API de DBPeru (java.dbperu.com/ApiRuc, no requiere token).
 *
 *   POST {url}  { "nroDocumento": "20100070970" }
 *   OK:     { "success": true,  "result": { "RazonSocial", "Direccion", "Estado", "Condicion", "Nombres", "Apellidos", ... } }
 *   No hay: { "success": false, "msg": "Nro DNI no valido." }
 * Los campos sin dato vienen como "-".
 */
class ConsultaDocumentoService
{
    /**
     * @return array{tipo_documento: string, numero_documento: string, razon_social: string, direccion: ?string, estado: ?string, condicion: ?string}|null
     *         null = el documento no existe o la API no lo encontró.
     *
     * @throws RuntimeException si la API no está configurada o no responde.
     */
    public function consultar(string $numero): ?array
    {
        $url = (string) config('services.consulta_documento.url');
        if ($url === '') {
            throw new RuntimeException('La consulta de RUC/DNI no está configurada (CONSULTA_DOCUMENTO_URL).');
        }

        $tipo = DocumentoIdentidad::tipo($numero);
        if (! $tipo) {
            return null;
        }

        try {
            $respuesta = Http::acceptJson()
                ->timeout((int) config('services.consulta_documento.timeout', 10))
                ->post($url, ['nroDocumento' => $numero]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('No se pudo conectar con el servicio de consulta. Ingresa los datos manualmente.', 0, $e);
        }

        if (! $respuesta->successful()) {
            Log::warning('Consulta RUC/DNI respondió con error', ['status' => $respuesta->status()]);
            throw new RuntimeException('El servicio de consulta no respondió correctamente. Ingresa los datos manualmente.');
        }

        $data = $respuesta->json() ?? [];
        if (($data['success'] ?? false) !== true || ! is_array($data['result'] ?? null)) {
            return null;
        }

        $r = $data['result'];
        $nombre = $this->valor($r['RazonSocial'] ?? null)
            ?? trim(($this->valor($r['Apellidos'] ?? null) ?? '').' '.($this->valor($r['Nombres'] ?? null) ?? ''));

        if ($nombre === '') {
            return null;
        }

        $direccion = $this->valor($r['Direccion'] ?? null);

        return [
            'tipo_documento' => $tipo,
            'numero_documento' => $numero,
            // La API escapa las comillas simples duplicándolas ('' → ').
            'razon_social' => mb_substr(str_replace("''", "'", $nombre), 0, 150),
            'direccion' => $direccion ? mb_substr($direccion, 0, 150) : null,
            'estado' => $this->valor($r['Estado'] ?? null),
            'condicion' => $this->valor($r['Condicion'] ?? null),
        ];
    }

    /** "-" o vacío => null. */
    private function valor($v): ?string
    {
        $v = trim((string) $v);

        return $v === '' || $v === '-' ? null : preg_replace('/\s+/u', ' ', $v);
    }
}
