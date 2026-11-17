<?php

namespace Tests\Unit;

use App\Support\TipoComprobante;
use PHPUnit\Framework\TestCase;

class TipoComprobanteTest extends TestCase
{
    public function test_series_validas_por_tipo_de_comprobante(): void
    {
        $this->assertTrue(TipoComprobante::serieValida(TipoComprobante::FACTURA, 'f001'));
        $this->assertFalse(TipoComprobante::serieValida(TipoComprobante::FACTURA, 'B001'));
        $this->assertTrue(TipoComprobante::serieValida(TipoComprobante::BOLETA, 'B900'));
        $this->assertFalse(TipoComprobante::serieValida(TipoComprobante::BOLETA, 'B0001'));
        $this->assertTrue(TipoComprobante::serieValida(TipoComprobante::TICKET, 'T001'));
        $this->assertFalse(TipoComprobante::serieValida(TipoComprobante::TICKET, 'T-01'));
        $this->assertFalse(TipoComprobante::serieValida('XX', 'T001'));
    }

    public function test_ticket_reemplaza_a_otro_en_el_catalogo(): void
    {
        $nombres = array_column(TipoComprobante::catalogo(), 'nombre', 'codigo');

        $this->assertSame(['01' => 'Factura', '03' => 'Boleta', '12' => 'Ticket'], $nombres);
        $this->assertNotContains('Otro', $nombres);
    }
}
