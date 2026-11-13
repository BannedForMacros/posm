<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Articulo;
use App\Models\Familia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Artículos de la empresa activa.
 *
 * - `codarticulo`: ID interno (entero, lo genera la BD). Lo usan las FKs y las rutas.
 * - `codigo`: código visible y LIBRE (alfanumérico) que elige el cliente, único por empresa.
 *   Si no se envía, se propone el siguiente número libre de la empresa.
 */
class ArticuloManageController extends Controller
{
    /** Letras, números y separadores comunes. Sin espacios. */
    private const PATRON_CODIGO = '/^[A-Z0-9][A-Z0-9\-_.\/]*$/';

    // GET /api/articulos-manage
    public function index(): JsonResponse
    {
        $articulos = Articulo::where('ruc', $this->ruc())
            ->where('estado', 1)
            ->orderBy('nombrearticulo')
            ->get();

        return response()->json($articulos);
    }

    // GET /api/articulos-manage/siguiente-codigo
    public function siguienteCodigo(): JsonResponse
    {
        return response()->json(['codigo' => $this->proximoCodigo($this->ruc())]);
    }

    // GET /api/articulos-manage/{codarticulo}
    public function show($codarticulo): JsonResponse
    {
        $articulo = $this->buscar($codarticulo);

        return $articulo
            ? response()->json($articulo)
            : response()->json(['message' => 'Artículo no encontrado'], 404);
    }

    // POST /api/articulos-manage
    public function store(Request $request): JsonResponse
    {
        $ruc = $this->ruc();
        $datos = $this->validar($request, $ruc);

        $articulo = DB::transaction(function () use ($datos, $ruc) {
            $articulo = new Articulo();
            $articulo->fill($datos);
            $articulo->ruc = $ruc;
            $articulo->codigo = $datos['codigo'] ?? $this->proximoCodigo($ruc);
            $articulo->nombrecorto = $datos['nombrecorto'] ?? mb_substr($datos['nombrearticulo'], 0, 50);
            $articulo->stockminimo = $datos['stockminimo'] ?? 0;
            $articulo->stockmaximo = $datos['stockmaximo'] ?? 0;
            $articulo->tipoigv = $datos['tipoigv'] ?? 1;
            $articulo->icbper = 0;
            $articulo->montoicbper = 0;
            $articulo->controlpeso = 0;
            $articulo->estado = 1;
            // codarticulo lo asigna la BD (identity): nunca viene del cliente.
            $articulo->save();

            return $articulo;
        });

        return response()->json([
            'message' => 'Artículo creado correctamente',
            'data' => $articulo->fresh(),
        ], 201);
    }

    // PUT /api/articulos-manage/{codarticulo}
    public function update(Request $request, $codarticulo): JsonResponse
    {
        $ruc = $this->ruc();
        $articulo = $this->buscar($codarticulo);
        if (! $articulo) {
            return response()->json(['message' => 'Artículo no encontrado'], 404);
        }

        $datos = $this->validar($request, $ruc, $articulo);

        $articulo->fill($datos);
        if (array_key_exists('codigo', $datos) && $datos['codigo'] === null) {
            $articulo->codigo = $articulo->getOriginal('codigo'); // vacío = conservar el actual
        }
        if (array_key_exists('estado', $datos)) {
            $articulo->estado = $datos['estado'];
        }
        $articulo->save();

        return response()->json([
            'message' => 'Artículo actualizado correctamente',
            'data' => $articulo->fresh(),
        ]);
    }

    // DELETE /api/articulos-manage/{codarticulo} — baja lógica (estado = 0).
    public function destroy($codarticulo): JsonResponse
    {
        $articulo = $this->buscar($codarticulo);
        if (! $articulo) {
            return response()->json(['message' => 'Artículo no encontrado'], 404);
        }

        $articulo->estado = 0;
        $articulo->save();

        return response()->json(['message' => 'Artículo eliminado correctamente']);
    }

    // ----------------------------------------------------------------------

    private function validar(Request $request, string $ruc, ?Articulo $actual = null): array
    {
        // Normalización: el código se guarda en MAYÚSCULAS y sin espacios alrededor, para
        // que "a-01" y "A-01" no convivan como artículos distintos.
        $texto = fn ($v) => is_string($v) ? (trim(preg_replace('/\s+/u', ' ', $v)) ?: null) : $v;
        $request->merge([
            'codigo' => is_string($request->codigo) ? (mb_strtoupper(trim($request->codigo)) ?: null) : $request->codigo,
            'nombrearticulo' => $texto($request->nombrearticulo),
            'nombrecorto' => $texto($request->nombrecorto),
            'codbarra' => is_string($request->codbarra) ? (trim($request->codbarra) ?: null) : $request->codbarra,
            'codfamilia' => $request->codfamilia ?: null,
            'codsubfamilia' => $request->codsubfamilia ?: null,
            'stockminimo' => $request->stockminimo === '' ? null : $request->stockminimo,
            'stockmaximo' => $request->stockmaximo === '' ? null : $request->stockmaximo,
        ]);

        $ignorar = fn ($rule) => $actual ? $rule->ignore($actual->codarticulo, 'codarticulo') : $rule;

        $validator = validator($request->all(), [
            'codigo' => [
                'nullable', 'string', 'max:30', 'regex:'.self::PATRON_CODIGO,
                $ignorar(Rule::unique('articulos', 'codigo')->where('ruc', $ruc)),
            ],
            'nombrearticulo' => 'required|string|min:2|max:200',
            'nombrecorto' => 'nullable|string|max:50',
            'codbarra' => [
                'nullable', 'string', 'max:50', 'regex:/^[A-Za-z0-9\-]+$/',
                $ignorar(Rule::unique('articulos', 'codbarra')->where('ruc', $ruc)->where('estado', 1)),
            ],
            'codfamilia' => [
                'nullable', 'string', 'size:3',
                Rule::exists('familia', 'codfamilia')->where('ruc', $ruc)->where('estado', 1),
            ],
            'codsubfamilia' => 'nullable|string|size:3',
            'stockminimo' => 'nullable|numeric|min:0|max:99999999',
            'stockmaximo' => 'nullable|numeric|min:0|max:99999999',
            'tipoigv' => 'nullable|integer|min:0|max:99',
            'estado' => 'sometimes|integer|in:0,1',
        ], [
            'codigo.regex' => 'El código solo admite letras, números y los signos - _ . / (sin espacios), y debe empezar con letra o número.',
            'codigo.max' => 'El código no puede superar 30 caracteres.',
            'codigo.unique' => 'Ya existe un artículo con el código ":input".',
            'nombrearticulo.required' => 'Escribe el nombre del artículo.',
            'nombrearticulo.min' => 'El nombre debe tener al menos 2 caracteres.',
            'nombrearticulo.max' => 'El nombre no puede superar 200 caracteres.',
            'nombrecorto.max' => 'El nombre corto no puede superar 50 caracteres.',
            'codbarra.regex' => 'El código de barras solo admite letras, números y guiones.',
            'codbarra.max' => 'El código de barras no puede superar 50 caracteres.',
            'codbarra.unique' => 'Ese código de barras ya está asignado a otro artículo.',
            'codfamilia.exists' => 'La familia seleccionada no existe o está inactiva.',
            'codfamilia.size' => 'La familia seleccionada no es válida.',
            'codsubfamilia.size' => 'La subfamilia seleccionada no es válida.',
            'stockminimo.numeric' => 'El stock mínimo debe ser un número.',
            'stockminimo.min' => 'El stock mínimo no puede ser negativo.',
            'stockmaximo.numeric' => 'El stock máximo debe ser un número.',
            'stockmaximo.min' => 'El stock máximo no puede ser negativo.',
            'stockminimo.max' => 'El stock mínimo es demasiado grande.',
            'stockmaximo.max' => 'El stock máximo es demasiado grande.',
        ]);

        // Reglas que dependen de varios campos.
        $validator->after(function (Validator $v) use ($request, $ruc) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }
            $fam = $request->codfamilia;
            $sub = $request->codsubfamilia;
            if ($sub && ! $fam) {
                $v->errors()->add('codsubfamilia', 'Selecciona primero la familia.');
            } elseif ($sub && ! Familia::where('ruc', $ruc)->where('estado', 1)->where('codfamilia', $fam.$sub)->exists()) {
                $v->errors()->add('codsubfamilia', 'La subfamilia no pertenece a la familia seleccionada.');
            }

            $min = $request->stockminimo;
            $max = $request->stockmaximo;
            if ($min !== null && $max !== null && (float) $max > 0 && (float) $max < (float) $min) {
                $v->errors()->add('stockmaximo', 'El stock máximo no puede ser menor que el stock mínimo.');
            }
        });

        $datos = $validator->validate();

        return array_intersect_key($datos, array_flip([
            'codigo', 'nombrearticulo', 'nombrecorto', 'codbarra', 'codfamilia',
            'codsubfamilia', 'stockminimo', 'stockmaximo', 'tipoigv', 'estado',
        ]));
    }

    /** Siguiente código numérico libre de la empresa (los alfanuméricos no cuentan). */
    private function proximoCodigo(?string $ruc): string
    {
        $max = Articulo::where('ruc', $ruc)
            ->pluck('codigo')
            ->filter(fn ($c) => is_string($c) && ctype_digit($c) && strlen($c) <= 9)
            ->map(fn ($c) => (int) $c)
            ->max() ?? 0;

        $siguiente = $max + 1;
        while (Articulo::where('ruc', $ruc)->where('codigo', (string) $siguiente)->exists()) {
            $siguiente++;
        }

        return (string) $siguiente;
    }

    private function ruc(): ?string
    {
        return auth()->user()?->ruc;
    }

    private function buscar($codarticulo): ?Articulo
    {
        if (! ctype_digit((string) $codarticulo)) {
            return null;
        }

        return Articulo::where('codarticulo', (int) $codarticulo)
            ->where('ruc', $this->ruc())
            ->first();
    }
}
