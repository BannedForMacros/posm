<?php

namespace App\Support;

/**
 * Documentos de identidad del cliente (Perú).
 *
 * - DNI: 8 dígitos.
 * - RUC: 11 dígitos, prefijo 10/15/16/17/20 y dígito verificador módulo 11 (SUNAT).
 */
final class DocumentoIdentidad
{
    public const DNI = 'DNI';
    public const RUC = 'RUC';

    private const PREFIJOS_RUC = ['10', '15', '16', '17', '20'];
    private const PESOS_RUC = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    /** Deja solo los dígitos ("20-1007 0970" => "20100070970"). */
    public static function limpiar(?string $numero): string
    {
        return preg_replace('/\D/', '', (string) $numero);
    }

    /** "RUC", "DNI" o null si no es un documento válido. */
    public static function tipo(?string $numero): ?string
    {
        $numero = self::limpiar($numero);

        if (self::esDniValido($numero)) {
            return self::DNI;
        }

        return self::esRucValido($numero) ? self::RUC : null;
    }

    public static function esDniValido(?string $dni): bool
    {
        return (bool) preg_match('/^\d{8}$/', (string) $dni);
    }

    public static function esRucValido(?string $ruc): bool
    {
        $ruc = (string) $ruc;
        if (! preg_match('/^\d{11}$/', $ruc) || ! in_array(substr($ruc, 0, 2), self::PREFIJOS_RUC, true)) {
            return false;
        }

        $suma = 0;
        foreach (self::PESOS_RUC as $i => $peso) {
            $suma += (int) $ruc[$i] * $peso;
        }
        $digito = 11 - ($suma % 11);
        $digito = match ($digito) {
            10 => 0,
            11 => 1,
            default => $digito,
        };

        return $digito === (int) $ruc[10];
    }

    /** Mensaje de error para un número inválido, o null si es válido. */
    public static function error(?string $numero): ?string
    {
        $numero = self::limpiar($numero);

        return match (true) {
            $numero === '' => 'Ingresa el DNI (8 dígitos) o RUC (11 dígitos).',
            strlen($numero) === 8 => null,
            strlen($numero) === 11 => self::esRucValido($numero) ? null : 'El RUC no es válido (revisa los dígitos).',
            default => 'El documento debe tener 8 dígitos (DNI) u 11 dígitos (RUC).',
        };
    }
}
