<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@marketplace.com'],
            [
                'name' => 'ADMIN',
                'password' => Hash::make('password123'),
                'phone' => '082251979931',
                'address' => 'Lampung Timur, Lampung'
            ]
        );

        $admin->forceFill(['role' => 'super_admin'])->save();
    }
}
