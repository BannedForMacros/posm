<?php

namespace Tests\Unit;

use App\Support\TotalesVenta;
use PHPUnit\Framework\TestCase;

class TotalesVentaTest extends TestCase
{
    public function test_precio_con_igv_se_desglosa_en_neto_e_igv(): void
    {
        $r = TotalesVenta::calcular([['cantidad' => 1, 'precio_unitario' => 118]]);

        $this->assertSame(118.0, $r['total']);
        $this->assertSame(100.0, $r['neto']);
        $this->assertSame(18.0, $r['igv']);
        $this->assertSame(1, $r['lineas'][0]['item']);
        $this->assertSame(100.0, $r['lineas'][0]['neto_unitario']);
    }

    public function test_neto_mas_igv_siempre_cuadra_con_el_total(): void
    {
        $r = TotalesVenta::calcular([
            ['cantidad' => 3, 'precio_unitario' => 2.5],
            ['cantidad' => 0.75, 'precio_unitario' => 13.9],
            ['cantidad' => 7, 'precio_unitario' => 1.1],
        ]);

        $this->assertSame(round(7.5 + 10.43 + 7.7, 2), $r['total']);
        $this->assertEqualsWithDelta($r['total'], $r['neto'] + $r['igv'], 0.0001);
        $this->assertCount(3, $r['lineas']);
        $this->assertSame([1, 2, 3], array_column($r['lineas'], 'item'));
    }

    public function test_precio_cero_no_genera_importes(): void
    {
        $r = TotalesVenta::calcular([['cantidad' => 2, 'precio_unitario' => 0]]);

        $this->assertSame(0.0, $r['total']);
        $this->assertSame(0.0, $r['igv']);
    }
}
