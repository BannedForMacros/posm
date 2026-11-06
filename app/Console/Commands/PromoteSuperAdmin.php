<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteSuperAdmin extends Command
{
    protected $signature = 'posm:superadmin
                            {email : Correo del usuario a promover}
                            {--revoke : Quitar el rol de superadministrador}';

    protected $description = 'Promueve (o revoca) el rol de superadministrador de un usuario';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('email'))->first();

        if (! $user) {
            $this->error('No existe un usuario con ese correo.');

            return self::FAILURE;
        }

        $user->update([
            'is_superadmin' => ! $this->option('revoke'),
            'activo' => true,
        ]);

        $this->info(
            $this->option('revoke')
                ? "Se quitó el rol de superadministrador a {$user->email}."
                : "{$user->email} ahora es superadministrador."
        );

        return self::SUCCESS;
    }
}
