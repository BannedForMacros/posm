<?php

namespace App\Support;

/**
 * Totales de una venta con precios que INCLUYEN IGV (como los ingresa el cajero).
 *
 * Por línea:  total = cantidad × precio (2 dec.) · neto unitario = precio / (1 + tasa)
 *             IGV   = total − neto × cantidad
 * Los totales del documento son la suma de las líneas redondeada a 2 decimales, de
 * modo que neto + IGV = total siempre cuadra.
 */
final class TotalesVenta
{
    public const TASA_IGV = 18.0;

    /**
     * @param  array<int, array{cantidad: float|int|string, precio_unitario: float|int|string}>  $lineas
     * @return array{lineas: array<int, array>, neto: float, igv: float, total: float}
     */
    public static function calcular(array $lineas, float $tasa = self::TASA_IGV): array
    {
        $factor = 1 + ($tasa / 100);
        $resultado = [];
        $total = 0.0;
        $neto = 0.0;

        foreach (array_values($lineas) as $i => $linea) {
            $cantidad = (float) $linea['cantidad'];
            $precio = (float) $linea['precio_unitario'];

            $totalLinea = round($cantidad * $precio, 2);
            $netoUnit = round($precio / $factor, 4);
            $netoLinea = round($totalLinea / $factor, 2);

            $resultado[] = [
                'item' => $i + 1,
                'cantidad' => $cantidad,
                'precio_unitario' => $precio,
                'neto_unitario' => $netoUnit,
                'neto' => $netoLinea,
                'igv' => round($totalLinea - $netoLinea, 2),
                'total' => $totalLinea,
            ];

            $total += $totalLinea;
            $neto += $netoLinea;
        }

        $total = round($total, 2);
        $neto = round($neto, 2);

        return [
            'lineas' => $resultado,
            'neto' => $neto,
            'igv' => round($total - $neto, 2),
            'total' => $total,
        ];
    }
}
