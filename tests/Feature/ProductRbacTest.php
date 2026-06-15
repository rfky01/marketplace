<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Http\UploadedFile; // <--- Tambahkan ini agar bisa upload foto palsu
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class ProductRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset cache permission
        $this->app->make(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::create(['name' => 'create products']);
        Permission::create(['name' => 'edit products']);

        $roleSeller = Role::create(['name' => 'seller']);
        $roleSeller->givePermissionTo('create products');
        $roleSeller->givePermissionTo('edit products');

        Role::create(['name' => 'buyer']);
    }

    public function test_seller_can_create_product()
    {
        $this->withoutExceptionHandling();
        Storage::fake('public');
        Http::fake([
            config('services.ml_api.url') => Http::response([
                'status' => 'success',
                'kategori' => 'kerajinan',
                'skor_kepercayaan' => 95.5,
            ], 200),
        ]);

        $seller = User::factory()->create();
        $seller->assignRole('seller');

        $payload = [
            'nama_barang'  => 'Sepatu Test',
            'harga_barang' => 150000,         // <--- UBAH INI (dari 'harga' jadi 'harga_barang')
            'deskripsi'    => 'Kondisi bagus',
            'stok_barang'  => 10,
            'foto_barang'  => [ 
                UploadedFile::fake()->image('sepatu.jpg')
            ]
        ];

        // Nyalakan dump ini lagi jika masih error, agar kita tahu apa errornya
        // $response = $this->actingAs($seller)->postJson('/api/produk', $payload);
        // $response->dump(); 

        $response = $this->actingAs($seller)
                         ->postJson('/api/produk', $payload);

        $response->assertStatus(201);
        
        $this->assertDatabaseHas('produk', [
            'nama_barang' => 'Sepatu Test',
            'harga_barang' => 150000, // <--- Pastikan di sini juga pakai 'harga_barang'
            'kategori' => 'kerajinan',
        ]);
    }

    public function test_buyer_cannot_create_product()
    {
        $buyer = User::factory()->create();
        $buyer->assignRole('buyer');

        // PERBAIKAN 3: URL diganti jadi '/api/produk'
        $response = $this->actingAs($buyer)
                         ->postJson('/api/produk', [
                             'name' => 'Produk Ilegal',
                             'harga_barang' => 5000
                         ]);

        $response->assertStatus(403);
        
        // PERBAIKAN 4: Nama tabel diganti jadi 'produk'
        $this->assertDatabaseMissing('produk', [
            'name' => 'Produk Ilegal'
        ]);
    }
}
