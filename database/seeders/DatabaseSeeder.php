<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin account — change password after first deploy
        User::firstOrCreate(
            ['email' => 'admin@notak2.app'],
            [
                'name'     => 'Notak2 Admin',
                'password' => Hash::make('changeme_admin_2026!'),
                'role'     => 'admin',
                'is_active'=> true,
            ]
        );

        // CI (Cyber Inspector) account
        User::firstOrCreate(
            ['email' => 'ci@notak2.app'],
            [
                'name'     => 'Cyber Inspector',
                'password' => Hash::make('changeme_ci_2026!'),
                'role'     => 'ci',
                'is_active'=> true,
            ]
        );
    }
}
