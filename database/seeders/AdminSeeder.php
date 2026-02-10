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
        User::create([
            'name' => 'ADMIN',
            'email' => 'admin@marketplace.com', 
            'password' => Hash::make('password123'),
            'role' => 'admin',
            //'phone' => '082251979931',
            //'address' => 'Lampung Timur, Lampung'
        ]);
    }
}