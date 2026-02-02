<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder; // <-- Ini penting, jangan sampai hilang
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder  // <-- Kode Anda error karena baris ini hilang
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@marketplace.com', 
            'password' => Hash::make('password123'),
            'role' => 'admin',
            
            // Pastikan kolom lain yang required di database Anda juga diisi dummy, 
            // misalnya jika ada 'no_hp' atau 'alamat', tambahkan di sini.
            // 'no_hp' => '0812345678', 
        ]);
    }
}