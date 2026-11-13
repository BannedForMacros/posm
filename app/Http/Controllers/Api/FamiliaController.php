<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Familia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Familias y subfamilias de la empresa activa.
 *
 * Códigos (los genera el sistema, el usuario solo escribe nombres):
 *   - familia    = 3 dígitos  ("001")
 *   - subfamilia = 6 dígitos  ("001002" = familia 001 + subfamilia 002)
 * La PK es (ruc, codfamilia): cada empresa numera desde 001. Por eso toda lectura/escritura
 * filtra por ruc y NO se usa $familia->save() (Eloquent solo conoce codfamilia como clave).
 */
class FamiliaController extends Controller
{
    private const MAX_NOMBRE = 100;

    // GET /api/familias
    public function index(): JsonResponse
    {
        $familias = Familia::where('ruc', $this->ruc())
            ->where('estado', 1)
            ->orderBy('codfamilia')
            ->get();

        return response()->json($familias);
    }

    // GET /api/familias/{codfamilia}
    public function show($codfamilia): JsonResponse
    {
        $familia = $this->buscar($codfamilia);

        return $familia
            ? response()->json($familia)
            : response()->json(['message' => 'Familia no encontrada'], 404);
    }

    // POST /api/familias
    // Familia:    { tipo: "familia", familia: "Abarrotes" }
    // Subfamilia: { tipo: "subfamilia", codfamilia_padre: "001", subfamilia: "Aceites" }
    public function store(Request $request): JsonResponse
    {
        $ruc = $this->ruc();
        $request->merge([
            'familia' => $this->limpiar($request->input('familia')),
            'subfamilia' => $this->limpiar($request->input('subfamilia')),
        ]);

        $datos = $request->validate([
            'tipo' => 'required|in:familia,subfamilia',
            'familia' => 'required_if:tipo,familia|nullable|string|max:'.self::MAX_NOMBRE,
            'codfamilia_padre' => 'required_if:tipo,subfamilia|nullable|string|size:3',
            'subfamilia' => 'required_if:tipo,subfamilia|nullable|string|max:'.self::MAX_NOMBRE,
        ], $this->mensajes());

        $familia = DB::transaction(function () use ($datos, $ruc) {
            if ($datos['tipo'] === 'familia') {
                $this->exigirNombreLibre($ruc, $datos['familia']);

                return $this->insertar($ruc, $this->siguienteCodigo($ruc), $datos['familia'], null);
            }

            $padre = $this->buscar($datos['codfamilia_padre']);
            if (! $padre || strlen($padre->codfamilia) !== 3 || (int) $padre->estado !== 1) {
                throw ValidationException::withMessages(['codfamilia_padre' => 'Selecciona una familia válida.']);
            }
            $this->exigirNombreLibre($ruc, $datos['subfamilia'], $padre->codfamilia);

            return $this->insertar($ruc, $this->siguienteCodigo($ruc, $padre->codfamilia), $padre->familia, $datos['subfamilia']);
        });

        return response()->json([
            'message' => strlen($familia->codfamilia) === 3 ? 'Familia creada correctamente' : 'Subfamilia creada correctamente',
            'data' => $familia,
        ], 201);
    }

    // PUT /api/familias/{codfamilia} — solo se editan nombres; el código no cambia.
    public function update(Request $request, $codfamilia): JsonResponse
    {
        $ruc = $this->ruc();
        $familia = $this->buscar($codfamilia);
        if (! $familia) {
            return response()->json(['message' => 'Familia no encontrada'], 404);
        }

        $esSub = strlen($familia->codfamilia) === 6;
        $campo = $esSub ? 'subfamilia' : 'familia';
        $request->merge([$campo => $this->limpiar($request->input($campo))]);
        $nombre = $request->validate([
            $campo => 'required|string|max:'.self::MAX_NOMBRE,
        ], $this->mensajes())[$campo];

        DB::transaction(function () use ($ruc, $familia, $esSub, $nombre) {
            if ($esSub) {
                $this->exigirNombreLibre($ruc, $nombre, substr($familia->codfamilia, 0, 3), $familia->codfamilia);
                $this->query($ruc, $familia->codfamilia)->update(['subfamilia' => $nombre]);

                return;
            }

            $this->exigirNombreLibre($ruc, $nombre, null, $familia->codfamilia);
            // El nombre de la familia se repite en sus subfamilias: se renombra en todas.
            Familia::where('ruc', $ruc)
                ->where('codfamilia', 'like', $familia->codfamilia.'%')
                ->update(['familia' => $nombre]);
            // Filas antiguas donde la familia guardaba su propio nombre como subfamilia.
            if (mb_strtolower((string) $familia->subfamilia) === mb_strtolower((string) $familia->familia)) {
                $this->query($ruc, $familia->codfamilia)->update(['subfamilia' => null]);
            }
        });

        return response()->json([
            'message' => $esSub ? 'Subfamilia actualizada correctamente' : 'Familia actualizada correctamente',
            'data' => $this->buscar($familia->codfamilia),
        ]);
    }

    // DELETE /api/familias/{codfamilia} — baja lógica (estado = 0).
    public function destroy($codfamilia): JsonResponse
    {
        $ruc = $this->ruc();
        $familia = $this->buscar($codfamilia);
        if (! $familia) {
            return response()->json(['message' => 'Familia no encontrada'], 404);
        }

        $esSub = strlen($familia->codfamilia) === 6;
        $articulos = DB::table('articulos')->where('ruc', $ruc)->where('estado', 1)
            ->where('codfamilia', substr($familia->codfamilia, 0, 3))
            ->when($esSub, fn ($q) => $q->where('codsubfamilia', substr($familia->codfamilia, 3, 3)))
            ->count();

        if ($articulos > 0) {
            return response()->json([
                'message' => "No se puede eliminar: {$articulos} artículo(s) activo(s) la usan. Cámbialos de familia primero.",
            ], 422);
        }

        if (! $esSub) {
            $subfamilias = Familia::where('ruc', $ruc)->where('estado', 1)
                ->where('codfamilia', 'like', $familia->codfamilia.'%')
                ->whereRaw('LENGTH(codfamilia) = 6')
                ->count();
            if ($subfamilias > 0) {
                return response()->json([
                    'message' => "No se puede eliminar: tiene {$subfamilias} subfamilia(s) activa(s). Elimínalas primero.",
                ], 422);
            }
        }

        $this->query($ruc, $familia->codfamilia)->update(['estado' => 0]);

        return response()->json(['message' => $esSub ? 'Subfamilia eliminada correctamente' : 'Familia eliminada correctamente']);
    }

    // ----------------------------------------------------------------------

    private function ruc(): ?string
    {
        return auth()->user()?->ruc;
    }

    private function query(?string $ruc, string $codfamilia)
    {
        return Familia::where('ruc', $ruc)->where('codfamilia', $codfamilia);
    }

    private function buscar($codfamilia): ?Familia
    {
        return $this->query($this->ruc(), (string) $codfamilia)->first();
    }

    private function insertar(string $ruc, string $codigo, string $familia, ?string $subfamilia): Familia
    {
        Familia::insert([
            'codfamilia' => $codigo,
            'ruc' => $ruc,
            'familia' => $familia,
            'subfamilia' => $subfamilia,
            'estado' => 1,
        ]);

        return $this->query($ruc, $codigo)->first();
    }

    /** Siguiente correlativo de la empresa: "NNN" o, con $padre, "PPPNNN". */
    private function siguienteCodigo(string $ruc, ?string $padre = null): string
    {
        $largo = $padre ? 6 : 3;
        $max = Familia::where('ruc', $ruc)
            ->when($padre, fn ($q) => $q->where('codfamilia', 'like', $padre.'%'))
            ->lockForUpdate()
            ->pluck('codfamilia')
            ->filter(fn ($c) => strlen((string) $c) === $largo && ctype_digit((string) $c))
            ->map(fn ($c) => (int) substr($c, -3))
            ->max() ?? 0;

        if ($max >= 999) {
            throw ValidationException::withMessages([
                $padre ? 'subfamilia' : 'familia' => 'Se alcanzó el máximo de 999 '.($padre ? 'subfamilias en esta familia.' : 'familias.'),
            ]);
        }

        return ($padre ?? '').str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Nombre único (sin distinguir mayúsculas) entre las familias activas de la empresa,
     * o entre las subfamilias activas de $padre.
     */
    private function exigirNombreLibre(string $ruc, string $nombre, ?string $padre = null, ?string $excepto = null): void
    {
        $existe = Familia::where('ruc', $ruc)
            ->where('estado', 1)
            ->when($excepto, fn ($q) => $q->where('codfamilia', '<>', $excepto))
            ->when(
                $padre,
                fn ($q) => $q->where('codfamilia', 'like', $padre.'%')->whereRaw('LENGTH(codfamilia) = 6')
                    ->whereRaw('LOWER(subfamilia) = ?', [mb_strtolower($nombre)]),
                fn ($q) => $q->whereRaw('LENGTH(codfamilia) = 3')
                    ->whereRaw('LOWER(familia) = ?', [mb_strtolower($nombre)])
            )
            ->exists();

        if ($existe) {
            throw ValidationException::withMessages([
                $padre ? 'subfamilia' : 'familia' => $padre
                    ? "Ya existe la subfamilia \"{$nombre}\" en esta familia."
                    : "Ya existe la familia \"{$nombre}\".",
            ]);
        }
    }

    /** Recorta y colapsa espacios; cadena vacía => null. */
    private function limpiar($valor): ?string
    {
        if (! is_string($valor)) {
            return $valor === null ? null : (string) $valor;
        }
        $valor = trim(preg_replace('/\s+/u', ' ', $valor));

        return $valor === '' ? null : $valor;
    }

    private function mensajes(): array
    {
        return [
            'tipo.required' => 'Indica si es familia o subfamilia.',
            'familia.required' => 'Escribe el nombre de la familia.',
            'familia.required_if' => 'Escribe el nombre de la familia.',
            'familia.max' => 'El nombre no puede superar :max caracteres.',
            'codfamilia_padre.required_if' => 'Selecciona la familia a la que pertenece.',
            'codfamilia_padre.size' => 'Selecciona una familia válida.',
            'subfamilia.required' => 'Escribe el nombre de la subfamilia.',
            'subfamilia.required_if' => 'Escribe el nombre de la subfamilia.',
            'subfamilia.max' => 'El nombre no puede superar :max caracteres.',
        ];
    }
}
