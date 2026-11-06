<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    use HasFactory;

    protected $table = 'empresas';

    protected $fillable = [
        'ruc',
        'razon_social',
        'nombre_comercial',
        'direccion',
        'telefono',
        'email',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'estado' => 'boolean',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'empresa_user')
            ->withPivot(['rol', 'activo'])
            ->withTimestamps();
    }

    public function usuariosActivos(): BelongsToMany
    {
        return $this->users()
            ->wherePivot('activo', true)
            ->where('users.activo', true);
    }

    public function sucursales(): HasMany
    {
        return $this->hasMany(Sucursal::class, 'empresa_id');
    }

    public function scopeActivas(Builder $query): Builder
    {
        return $query->where('estado', true);
    }

    public function getNombreAttribute(): string
    {
        return $this->nombre_comercial ?: $this->razon_social;
    }

    public function getInicialAttribute(): string
    {
        return mb_strtoupper(mb_substr($this->getNombreAttribute(), 0, 1));
    }
}
