<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\SerieDocumento;
use App\Models\WarehouseDocument;
use App\Models\WarehouseDocumentDetail;
use App\Support\DocumentoIdentidad;
use App\Support\TipoComprobante;
use App\Support\TotalesVenta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Validator;

class VentasController extends Controller
{
    private const CLIENTE_VARIOS = 'CLIENTES VARIOS';

    /** GET /api/ventas — ventas de la empresa activa. */
    public function index(Request $request)
    {
        try {
            return response()->json(DB::select('SELECT * FROM "ObtenerVentasPorRUC"(?)', [$request->user()->ruc]));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener las ventas', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/ventas/configuracion — todo lo que necesita el formulario "Crear venta".
     * La fecha la fija el servidor (no es editable).
     */
    public function configuracion(Request $request): JsonResponse
    {
        $ruc = $request->user()->ruc;

        return response()->json([
            'fecha' => now()->format('Y-m-d'),
            'tipos' => TipoComprobante::catalogo(),
            'almacenes' => $this->almacenesDeEmpresa($ruc)->values(),
            'listas_precios' => DB::table('lista_precios')->where('ruc', $ruc)->where('estado', 1)
                ->orderBy('id')->get(['id', 'nombre']),
            'boleta_monto_identificacion' => TipoComprobante::BOLETA_MONTO_IDENTIFICACION,
        ]);
    }

    /**
     * GET /api/ventas/catalogo?lista_precios_id=&almacen_id=
     * Artículos activos con su precio por defecto (según la lista) y su stock (según el almacén).
     */
    public function catalogo(Request $request): JsonResponse
    {
        $ruc = $request->user()->ruc;
        $request->validate([
            'lista_precios_id' => 'nullable|integer',
            'almacen_id' => 'nullable|integer',
        ]);

        $listaId = $request->filled('lista_precios_id')
            && DB::table('lista_precios')->where('id', $request->lista_precios_id)->where('ruc', $ruc)->exists()
            ? (int) $request->lista_precios_id : null;
        $almacenId = $request->filled('almacen_id')
            && $this->almacenesDeEmpresa($ruc)->contains('id', (int) $request->almacen_id)
            ? (int) $request->almacen_id : null;

        $articulos = DB::table('articulos as a')
            ->leftJoin('unidadmedida as u', 'u.codunidad', '=', 'a.codunidad')
            ->where('a.ruc', $ruc)
            ->where('a.estado', 1)
            ->orderBy('a.nombrearticulo')
            ->get(['a.codarticulo', 'a.codigo', 'a.nombrearticulo', 'a.codbarra', 'a.codunidad', 'u.unidad', 'u.siglasunat']);

        // Precio: el de la unidad del artículo en la lista; si no hay, el marcado por defecto.
        $precios = $listaId
            ? DB::table('preciosunidadm')->where('lista_precios_id', $listaId)
                ->orderByDesc('pordefecto')->get(['codarticulo', 'codunidad', 'preciopublico'])
                ->groupBy('codarticulo')
            : collect();

        $stock = $almacenId
            ? DB::table('inventario')->where('ruc', $ruc)->where('almacen_id', $almacenId)
                ->pluck('stock', 'cod_articulo')
            : collect();

        return response()->json($articulos->map(function ($a) use ($precios, $stock, $almacenId) {
            $filas = $precios->get($a->codarticulo, collect());
            $fila = $filas->firstWhere('codunidad', $a->codunidad) ?? $filas->first();

            return [
                'codarticulo' => $a->codarticulo,
                'codigo' => $a->codigo ?: (string) $a->codarticulo,
                'nombre' => $a->nombrearticulo,
                'codbarra' => $a->codbarra,
                'codunidad' => $a->codunidad,
                'unidad' => $a->siglasunat ?: 'NIU',
                'unidad_nombre' => $a->unidad ?: 'unidad',
                'precio' => $fila ? round((float) $fila->preciopublico, 2) : null,
                'stock' => $almacenId ? (float) ($stock[$a->codarticulo] ?? 0) : null,
            ];
        })->values());
    }

    /**
     * POST /api/ventas — registra la venta en una transacción:
     * valida → bloquea la serie → asigna correlativo → inserta cabecera y detalle →
     * guarda/actualiza el cliente → documento de almacén → descuenta inventario.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $ruc = $user->ruc;
        if (! $ruc) {
            return response()->json(['message' => 'No hay una empresa activa para registrar la venta.'], 422);
        }

        [$datos, $articulos] = $this->validarVenta($request, $ruc);

        $cod = $datos['cod_documento'];
        $serie = $datos['seri_venta'];
        $totales = TotalesVenta::calcular($datos['detalles']);
        $cliente = $this->resolverCliente($datos, $cod, $totales['total']);

        $resultado = DB::transaction(function () use ($datos, $ruc, $user, $cod, $serie, $totales, $cliente, $articulos) {
            // Bloquear la serie serializa las ventas concurrentes de la misma serie:
            // dos cajeros no pueden obtener el mismo correlativo.
            SerieDocumento::activas($ruc, $cod)->where('serie', $serie)->lockForUpdate()->firstOrFail();
            $numero = (string) SerieDocumento::siguienteCorrelativo($ruc, $cod, $serie);

            $this->validarStock($ruc, $datos['almacen_id'], $datos['detalles'], $articulos);

            $idCliente = null;
            if ($cliente['numero_documento'] !== '') {
                $idCliente = Cliente::updateOrCreate(
                    ['ruc_empresa' => $ruc, 'numero_documento' => $cliente['numero_documento']],
                    [
                        'tipo_documento' => $cliente['tipo_documento'],
                        'razon_social' => $cliente['razon_social'],
                        'direccion' => $cliente['direccion'],
                        'fuente' => $cliente['fuente'],
                    ]
                )->id;
            }

            $ahora = now();
            DB::table('ventas')->insert([
                'COD_DOCUMENTO' => $cod,
                'SERI_VENTA' => $serie,
                'NUME_VENTA' => $numero,
                'RUCEMPRESA' => $ruc,
                'ID_CLIENTE' => $idCliente,
                'FEMI_VENTA' => $ahora->format('Y-m-d'),
                'HORAEMISION' => $ahora->format('H:i:s'),
                'TNETO_VENTA' => $totales['neto'],
                'TDES_VENTA' => 0,
                'IMPU_VENTA' => $totales['igv'],
                'TOTAL_VENTA' => $totales['total'],
                'TCAMB_VENTA' => 1,
                'ESTA_VENTA' => 1,
                'fec_crea' => $ahora,
                'CREA_USUARIO' => $user->name,
                'TIPODOCUMENTOCLI' => $cliente['tipo_documento'],
                'NUMERODOCUMENTOCLI' => $cliente['numero_documento'],
                'RAZONSOCIALCLI' => $cliente['razon_social'],
                'DIRECCIONCLI' => $cliente['direccion'],
                'NUMEROITEMS' => (string) count($totales['lineas']),
                'CODALMACEN' => (string) $datos['almacen_id'],
            ]);

            foreach ($totales['lineas'] as $i => $linea) {
                $art = $articulos[$datos['detalles'][$i]['cod_articulo']];
                DB::table('ventasdetalle')->insert([
                    'COD_DOCUMENTO' => $cod,
                    'SERI_VENTA' => $serie,
                    'NUME_VENTA' => $numero,
                    'ID_VENTASD' => $linea['item'],
                    'COD_ARTICULO' => (string) $art->codarticulo,
                    'CODIGOARTINTERNO' => $art->codigo,
                    'COD_UNIDADM' => (string) ($art->codunidad ?? 1),
                    'UNIDADMEDIDA' => $art->siglasunat ?? 'NIU',
                    'CANT_VENTASD' => $linea['cantidad'],
                    'PUNI_VENTASD' => $linea['precio_unitario'],
                    'IMPU_VENTASD' => $linea['igv'],
                    'TNETO_VENTASD' => $linea['neto_unitario'],
                    'TDESC_VENTASD' => 0,
                    'TIMP_VENTASD' => $linea['total'],
                    'ESTA_VENTASD' => '1',
                    'TIP_IGV' => 1,
                    'TASA_IMP' => TotalesVenta::TASA_IGV,
                    'FEC_CREA' => $ahora,
                    'CREA_USUARIO' => $user->name,
                ]);
            }

            // Documento de almacén (salida). venta_id queda NULL: `ventas` no tiene PK simple.
            $doc = new WarehouseDocument();
            $doc->ruc = $ruc;
            $doc->almacen_id = $datos['almacen_id'];
            $doc->facturacion_id = null;
            $doc->venta_id = null;
            $doc->user_id = $user->id;
            $doc->operacion_id = 2; // Venta
            $doc->tipo_movimiento = 'SALIDA';
            $doc->fecha = $ahora;
            $doc->estado = 1;
            $doc->created_at = $ahora;
            $doc->updated_at = $ahora;
            $doc->save();

            foreach ($datos['detalles'] as $det) {
                WarehouseDocumentDetail::create([
                    'warehouse_document_id' => $doc->id,
                    'cod_articulo' => $det['cod_articulo'],
                    'cantidad' => $det['cantidad'],
                    'precio_unitario' => $det['precio_unitario'],
                    'costo' => 0,
                    'estado' => 1,
                    'created_at' => $ahora,
                    'updated_at' => $ahora,
                ]);

                DB::table('inventario')
                    ->where('ruc', $ruc)
                    ->where('almacen_id', $datos['almacen_id'])
                    ->where('cod_articulo', $det['cod_articulo'])
                    ->update(['stock' => DB::raw('stock - '.((float) $det['cantidad'])), 'updated_at' => $ahora]);
            }

            return ['numero' => $numero, 'warehouse_document_id' => $doc->id];
        });

        $comprobante = "{$serie}-{$resultado['numero']}";

        return response()->json([
            'success' => true,
            'message' => TipoComprobante::nombre($cod)." {$comprobante} registrada correctamente",
            'venta' => [
                'cod_documento' => $cod,
                'seri_venta' => $serie,
                'nume_venta' => $resultado['numero'],
                'total_venta' => $totales['total'],
            ],
            'warehouse_document_id' => $resultado['warehouse_document_id'],
        ], 201);
    }

    public function showDetails($cod_documento, $seri_venta, $nume_venta)
    {
        try {
            // Incluye el ruc: la PK de ventas es compuesta y la misma serie/número puede existir en otra empresa.
            return response()->json(DB::select('SELECT * FROM "ObtenerDetallesVenta"(?, ?, ?, ?)', [
                $cod_documento, $seri_venta, $nume_venta, auth()->user()->ruc,
            ]));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener los detalles de la venta', 'message' => $e->getMessage()], 500);
        }
    }

    public function showPaymentMethods($cod_documento, $seri_venta, $nume_venta)
    {
        try {
            return response()->json(DB::select('SELECT * FROM "ObtenerFormasPagoVenta"(?, ?, ?, ?)', [
                $cod_documento, $seri_venta, $nume_venta, auth()->user()->ruc,
            ]));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener las formas de pago', 'message' => $e->getMessage()], 500);
        }
    }

    // ------------------------------------------------------------------------

    /**
     * @return array{0: array, 1: array<int, object>} datos validados y artículos indexados por codarticulo
     */
    private function validarVenta(Request $request, string $ruc): array
    {
        $request->merge([
            'seri_venta' => TipoComprobante::normalizarSerie($request->seri_venta),
            'cliente_documento' => DocumentoIdentidad::limpiar($request->cliente_documento),
            'cliente_nombre' => trim(preg_replace('/\s+/u', ' ', (string) $request->cliente_nombre)),
            'cliente_direccion' => trim(preg_replace('/\s+/u', ' ', (string) $request->cliente_direccion)),
        ]);

        $articulos = [];
        $validator = validator($request->all(), [
            'cod_documento' => ['required', Rule::in(TipoComprobante::codigos())],
            'seri_venta' => [
                'required', 'string', 'max:4',
                Rule::exists('series_documento', 'serie')
                    ->where('ruc', $ruc)->where('cod_documento', $request->cod_documento)->where('estado', true),
            ],
            'almacen_id' => 'required|integer',
            'cliente_documento' => 'nullable|string|max:11',
            'cliente_nombre' => 'nullable|string|max:150',
            'cliente_direccion' => 'nullable|string|max:150',
            'cliente_fuente' => 'nullable|in:manual,consulta,local',
            'detalles' => 'required|array|min:1|max:200',
            'detalles.*.cod_articulo' => 'required|integer',
            'detalles.*.cantidad' => 'required|numeric|gt:0|max:999999',
            'detalles.*.precio_unitario' => 'required|numeric|min:0|max:9999999',
        ], [
            'cod_documento.required' => 'Selecciona el tipo de comprobante.',
            'cod_documento.in' => 'Tipo de comprobante no válido.',
            'seri_venta.required' => 'Selecciona la serie.',
            'seri_venta.exists' => 'La serie no está registrada para este comprobante.',
            'almacen_id.required' => 'Selecciona el almacén de salida.',
            'cliente_nombre.max' => 'El nombre del cliente no puede superar 150 caracteres.',
            'cliente_direccion.max' => 'La dirección no puede superar 150 caracteres.',
            'detalles.required' => 'Agrega al menos un artículo.',
            'detalles.min' => 'Agrega al menos un artículo.',
            'detalles.max' => 'Máximo 200 artículos por comprobante.',
            'detalles.*.cod_articulo.required' => 'Selecciona el artículo.',
            'detalles.*.cantidad.required' => 'Ingresa la cantidad.',
            'detalles.*.cantidad.numeric' => 'La cantidad debe ser un número.',
            'detalles.*.cantidad.gt' => 'La cantidad debe ser mayor que 0.',
            'detalles.*.cantidad.max' => 'Cantidad demasiado grande.',
            'detalles.*.precio_unitario.required' => 'Ingresa el precio.',
            'detalles.*.precio_unitario.numeric' => 'El precio debe ser un número.',
            'detalles.*.precio_unitario.min' => 'El precio no puede ser negativo.',
            'detalles.*.precio_unitario.max' => 'Precio demasiado grande.',
        ]);

        $validator->after(function (Validator $v) use ($request, $ruc, &$articulos) {
            if (! $v->errors()->has('almacen_id') && $request->filled('almacen_id')
                && ! $this->almacenesDeEmpresa($ruc)->contains('id', (int) $request->almacen_id)) {
                $v->errors()->add('almacen_id', 'El almacén no pertenece a la empresa.');
            }

            // Cliente
            $cod = (string) $request->cod_documento;
            $doc = (string) $request->cliente_documento;
            if ($cod === TipoComprobante::FACTURA) {
                if (! DocumentoIdentidad::esRucValido($doc)) {
                    $v->errors()->add('cliente_documento', $doc === '' ? 'La factura requiere el RUC del cliente.' : 'Ingresa un RUC válido (11 dígitos).');
                }
            } elseif ($doc !== '' && ($error = DocumentoIdentidad::error($doc))) {
                $v->errors()->add('cliente_documento', $error);
            }
            if ($doc !== '' && $request->cliente_nombre === '') {
                $v->errors()->add('cliente_nombre', 'Ingresa el nombre o razón social del cliente.');
            }

            // Artículos: deben ser de la empresa y estar activos.
            $codigos = collect($request->input('detalles', []))->pluck('cod_articulo')->filter(fn ($c) => is_numeric($c))->map(fn ($c) => (int) $c)->unique();
            $articulos = DB::table('articulos as a')
                ->leftJoin('unidadmedida as u', 'u.codunidad', '=', 'a.codunidad')
                ->where('a.ruc', $ruc)->where('a.estado', 1)->whereIn('a.codarticulo', $codigos)
                ->get(['a.codarticulo', 'a.codigo', 'a.nombrearticulo', 'a.codunidad', 'u.siglasunat'])
                ->keyBy('codarticulo')->all();
            foreach ($request->input('detalles', []) as $i => $det) {
                if (is_numeric($det['cod_articulo'] ?? null) && ! isset($articulos[(int) $det['cod_articulo']])) {
                    $v->errors()->add("detalles.{$i}.cod_articulo", 'El artículo no existe o está inactivo.');
                }
            }
        });

        $datos = $validator->validate();
        $datos['almacen_id'] = (int) $datos['almacen_id'];
        $datos['detalles'] = array_values(array_map(fn ($d) => [
            'cod_articulo' => (int) $d['cod_articulo'],
            'cantidad' => (float) $d['cantidad'],
            'precio_unitario' => round((float) $d['precio_unitario'], 4),
        ], $datos['detalles']));

        return [$datos, $articulos];
    }

    /** Datos del cliente a grabar; boleta sin documento = "CLIENTES VARIOS" (hasta el monto SUNAT). */
    private function resolverCliente(array $datos, string $cod, float $total): array
    {
        $doc = (string) ($datos['cliente_documento'] ?? '');

        if ($doc === '' && $cod === TipoComprobante::BOLETA && $total >= TipoComprobante::BOLETA_MONTO_IDENTIFICACION) {
            throw ValidationException::withMessages([
                'cliente_documento' => 'Las boletas desde S/ '.number_format(TipoComprobante::BOLETA_MONTO_IDENTIFICACION, 2).' requieren el DNI o RUC del cliente.',
            ]);
        }

        if ($doc === '') {
            return [
                'tipo_documento' => '',
                'numero_documento' => '',
                'razon_social' => $datos['cliente_nombre'] !== '' ? $datos['cliente_nombre'] : self::CLIENTE_VARIOS,
                'direccion' => null,
                'fuente' => 'manual',
            ];
        }

        return [
            'tipo_documento' => DocumentoIdentidad::tipo($doc),
            'numero_documento' => $doc,
            'razon_social' => mb_strtoupper($datos['cliente_nombre']),
            'direccion' => ($datos['cliente_direccion'] ?? '') !== '' ? $datos['cliente_direccion'] : null,
            'fuente' => ($datos['cliente_fuente'] ?? null) === 'consulta' ? 'consulta' : 'manual',
        ];
    }

    /** Stock suficiente sumando las líneas repetidas del mismo artículo. */
    private function validarStock(string $ruc, int $almacenId, array $detalles, array $articulos): void
    {
        $pedido = collect($detalles)->groupBy('cod_articulo')->map(fn ($l) => $l->sum('cantidad'));
        $stock = DB::table('inventario')->where('ruc', $ruc)->where('almacen_id', $almacenId)
            ->whereIn('cod_articulo', $pedido->keys())->lockForUpdate()->pluck('stock', 'cod_articulo');

        $faltantes = $pedido->filter(fn ($cant, $cod) => (float) ($stock[$cod] ?? 0) < $cant)
            ->map(fn ($cant, $cod) => sprintf(
                '%s: pides %s, hay %s',
                $articulos[$cod]->nombrearticulo ?? "Artículo {$cod}",
                rtrim(rtrim(number_format($cant, 4, '.', ''), '0'), '.'),
                rtrim(rtrim(number_format((float) ($stock[$cod] ?? 0), 4, '.', ''), '0'), '.')
            ));

        if ($faltantes->isNotEmpty()) {
            throw ValidationException::withMessages(['detalles' => 'Stock insuficiente — '.$faltantes->implode('; ')]);
        }
    }

    /** Almacenes activos de la empresa (vía sucursal_almacen → sucursal). */
    private function almacenesDeEmpresa(?string $ruc): Collection
    {
        return DB::table('almacen as a')
            ->join('sucursal_almacen as sa', 'sa.almacen_id', '=', 'a.id')
            ->join('sucursal as s', 's.id', '=', 'sa.sucursal_id')
            ->where('s.user_ruc', $ruc)
            ->where('a.estado', 1)->where('sa.estado', 1)->where('s.estado', 1)
            ->orderBy('a.nombre')
            ->distinct()
            ->get(['a.id', 'a.nombre']);
    }
}
