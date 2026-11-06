<?php

namespace App\Models;

use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'ruc',
        'password',
        'is_superadmin',
        'activo',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_superadmin' => 'boolean',
            'activo' => 'boolean',
        ];
    }

    public function empresas(): BelongsToMany
    {
        return $this->belongsToMany(Empresa::class, 'empresa_user')
            ->withPivot(['rol', 'activo'])
            ->withTimestamps();
    }

    public function empresasActivas(): BelongsToMany
    {
        return $this->empresas()
            ->wherePivot('activo', true)
            ->where('empresas.estado', true);
    }

    /**
     * El `ruc` que ve la aplicación es siempre el de la empresa activa.
     * El valor guardado en `users.ruc` queda como dato legado/por defecto.
     */
    protected function ruc(): Attribute
    {
        return Attribute::get(function (?string $value): ?string {
            $tenant = app(TenantContext::class);

            return $tenant->hasEmpresa() ? $tenant->ruc() : $value;
        });
    }

    public function esSuperadmin(): bool
    {
        return (bool) $this->is_superadmin;
    }

    public function estaActivo(): bool
    {
        return (bool) $this->activo;
    }

    /**
     * Empresas que el usuario puede seleccionar en el selector de empresa.
     *
     * @return Collection<int, Empresa>
     */
    public function empresasDisponibles(): Collection
    {
        if ($this->esSuperadmin()) {
            return Empresa::query()
                ->where('estado', true)
                ->orderBy('razon_social')
                ->get();
        }

        return $this->empresasActivas()
            ->orderBy('empresas.razon_social')
            ->get();
    }

    public function perteneceAEmpresa(int $empresaId): bool
    {
        if ($this->esSuperadmin()) {
            return true;
        }

        return $this->empresasActivas()
            ->whereKey($empresaId)
            ->exists();
    }

    public function rolEnEmpresa(int $empresaId): ?string
    {
        if ($this->esSuperadmin()) {
            return 'superadmin';
        }

        $empresa = $this->empresasActivas()
            ->whereKey($empresaId)
            ->first();

        return $empresa?->pivot?->rol;
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    public function scopeSuperadmins(Builder $query): Builder
    {
        return $query->where('is_superadmin', true);
    }
}
