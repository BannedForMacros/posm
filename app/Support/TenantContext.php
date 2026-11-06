<?php

namespace App\Support;

use App\Models\Empresa;
use LogicException;

/**
 * Contexto de la empresa (tenant) activa durante la petición.
 *
 * Es la única fuente de verdad para saber sobre qué empresa se está
 * operando. Los controladores existentes siguen leyendo `$user->ruc`,
 * pero el modelo User resuelve ese valor desde este contexto.
 */
class TenantContext
{
    private ?Empresa $empresa = null;

    public function set(Empresa $empresa): void
    {
        $this->empresa = $empresa;
    }

    public function clear(): void
    {
        $this->empresa = null;
    }

    public function hasEmpresa(): bool
    {
        return $this->empresa !== null;
    }

    public function empresa(): ?Empresa
    {
        return $this->empresa;
    }

    public function id(): ?int
    {
        return $this->empresa?->id;
    }

    public function ruc(): ?string
    {
        return $this->empresa?->ruc;
    }

    public function requireRuc(): string
    {
        if (! $this->hasEmpresa()) {
            throw new LogicException('No hay una empresa activa en el contexto.');
        }

        return (string) $this->empresa->ruc;
    }
}
