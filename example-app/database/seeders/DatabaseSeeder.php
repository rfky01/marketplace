<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // 1. Reset cache permission agar tidak error
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Buat Daftar Izin (Permission) untuk Marketplace
        $permissions = [
            'lihat barang',
            'tambah barang',
            'edit barang',
            'hapus barang',
            'beli barang',
            'kelola user', // Khusus Admin
            'kelola transaksi'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // 3. Buat Role & Pasang Izinnya

        // Role: PEMBELI (Hanya bisa lihat & beli)
        $rolePembeli = Role::create(['name' => 'pembeli']);
        $rolePembeli->givePermissionTo(['lihat barang', 'beli barang']);

        // Role: PENJUAL (Bisa kelola barang dagangan sendiri)
        $rolePenjual = Role::create(['name' => 'penjual']);
        $rolePenjual->givePermissionTo(['lihat barang', 'tambah barang', 'edit barang', 'hapus barang', 'kelola transaksi']);

        // Role: ADMIN (Dewa - Bisa segalanya)
        $roleAdmin = Role::create(['name' => 'admin']);
        $roleAdmin->givePermissionTo(Permission::all());

        // 4. (Opsional) Buat 1 Akun Admin Contoh
        $adminUser = User::factory()->create([
            'name' => 'Admin Marketplace',
            'email' => 'admin@toko.com',
            'password' => bcrypt('password123') // Password admin
        ]);
        $adminUser->assignRole($roleAdmin);

        $this->command->info('Role & Permission berhasil dibuat! Admin created: admin@toko.com / password123');
    }
}