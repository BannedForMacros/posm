<?php

namespace Tests\Unit;

use App\Support\DocumentoIdentidad;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class DocumentoIdentidadTest extends TestCase
{
    public static function rucsValidos(): array
    {
        return [
            'empresa (20)' => ['20100070970'],
            'empresa (20) con dígito 4' => ['20117332714'],
            'persona natural (10)' => ['10467793549'],
        ];
    }

    #[DataProvider('rucsValidos')]
    public function test_acepta_rucs_con_digito_verificador_correcto(string $ruc): void
    {
        $this->assertTrue(DocumentoIdentidad::esRucValido($ruc));
        $this->assertSame(DocumentoIdentidad::RUC, DocumentoIdentidad::tipo($ruc));
        $this->assertNull(DocumentoIdentidad::error($ruc));
    }

    public static function rucsInvalidos(): array
    {
        return [
            'dígito verificador incorrecto' => ['20100070971'],
            'prefijo inexistente' => ['30100070970'],
            'muy corto' => ['2010007097'],
            'con letras' => ['2010007097A'],
            'vacío' => [''],
        ];
    }

    #[DataProvider('rucsInvalidos')]
    public function test_rechaza_rucs_invalidos(string $ruc): void
    {
        $this->assertFalse(DocumentoIdentidad::esRucValido($ruc));
    }

    public function test_reconoce_dni_de_8_digitos(): void
    {
        $this->assertSame(DocumentoIdentidad::DNI, DocumentoIdentidad::tipo('46779354'));
        $this->assertNull(DocumentoIdentidad::error('46779354'));
        $this->assertNull(DocumentoIdentidad::tipo('4677935'));
    }

    public function test_limpiar_deja_solo_digitos(): void
    {
        $this->assertSame('20100070970', DocumentoIdentidad::limpiar(' 20-1000 70970 '));
        $this->assertSame('', DocumentoIdentidad::limpiar(null));
    }

    public function test_mensajes_de_error_claros(): void
    {
        $this->assertStringContainsString('8 dígitos', DocumentoIdentidad::error(''));
        $this->assertStringContainsString('8 dígitos (DNI) u 11', DocumentoIdentidad::error('12345'));
        $this->assertStringContainsString('RUC no es válido', DocumentoIdentidad::error('20100070971'));
    }
}
