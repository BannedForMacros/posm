<?php

namespace App\Support;

/**
 * Tipos de comprobante que se emiten desde "Crear venta" (catálogo 01 de SUNAT).
 */
final class TipoComprobante
{
    public const FACTURA = '01';
    public const BOLETA = '03';
    public const TICKET = '12';

    /** Monto desde el que una boleta exige identificar al cliente (SUNAT). */
    public const BOLETA_MONTO_IDENTIFICACION = 700.0;

    private const TIPOS = [
        self::FACTURA => ['nombre' => 'Factura', 'patron' => '/^F[A-Z0-9]{3}$/', 'ejemplo' => 'F001'],
        self::BOLETA => ['nombre' => 'Boleta', 'patron' => '/^B[A-Z0-9]{3}$/', 'ejemplo' => 'B001'],
        self::TICKET => ['nombre' => 'Ticket', 'patron' => '/^[A-Z0-9]{1,4}$/', 'ejemplo' => 'T001'],
    ];

    /** @return string[] */
    public static function codigos(): array
    {
        return array_keys(self::TIPOS);
    }

    public static function existe(?string $codigo): bool
    {
        return isset(self::TIPOS[(string) $codigo]);
    }

    public static function nombre(string $codigo): string
    {
        return self::TIPOS[$codigo]['nombre'] ?? $codigo;
    }

    public static function ejemplo(string $codigo): string
    {
        return self::TIPOS[$codigo]['ejemplo'] ?? '';
    }

    /** Serie en MAYÚSCULAS y sin espacios. */
    public static function normalizarSerie(?string $serie): string
    {
        return strtoupper(trim((string) $serie));
    }

    public static function serieValida(string $codigo, ?string $serie): bool
    {
        return isset(self::TIPOS[$codigo])
            && (bool) preg_match(self::TIPOS[$codigo]['patron'], self::normalizarSerie($serie));
    }

    public static function errorSerie(string $codigo): string
    {
        return match ($codigo) {
            self::FACTURA => 'La serie de factura debe empezar con F y tener 4 caracteres (ej. F001).',
            self::BOLETA => 'La serie de boleta debe empezar con B y tener 4 caracteres (ej. B001).',
            default => 'La serie debe tener de 1 a 4 letras o números (ej. T001).',
        };
    }

    /** @return array<int, array{codigo: string, nombre: string, ejemplo: string}> */
    public static function catalogo(): array
    {
        return array_map(
            fn ($codigo) => ['codigo' => $codigo, 'nombre' => self::nombre($codigo), 'ejemplo' => self::ejemplo($codigo)],
            self::codigos()
        );
    }
}
