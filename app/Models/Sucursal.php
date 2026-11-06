<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sucursal extends Model
{
    protected $table = 'sucursal';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected $fillable = [
        'empresa_id',
        'user_ruc',
        'nombre',
        'direccion',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'estado' => 'boolean',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function scopeActivas(Builder $query): Builder
    {
        return $query->where('estado', true);
    }
}
