<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\produkController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KeranjangController;
use App\Http\Controllers\RiviewController;
use App\Http\Controllers\ShopController; // Pastikan ini ada

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. ROUTE PUBLIC (Bisa diakses tanpa Login)
// ==========================================

Route::post('/register', [AuthController::class, 'register']); // Daftar
Route::post('/login', [AuthController::class, 'login']);       // Masuk

// Produk (Melihat katalog tidak perlu login)
Route::get('/produk', [produkController::class, 'index']);     // List Barang
Route::get('/produk/{id}', [produkController::class, 'show']); // Detail Barang


// ==========================================
// 2. ROUTE PROTECTED (Wajib Login / Punya Token)
// ==========================================

Route::middleware('auth:sanctum')->group(function () {

    // User Info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Auth & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // FITUR C2C: Buka Toko (Upgrade dari Pembeli ke Penjual)
    Route::post('/open-shop', [ShopController::class, 'openShop']);

    // Produk (Upload barang - Logic pengecekan "Penjual" ada di Controller)
    Route::post('/produk', [produkController::class, 'store']); 

    // Order (Transaksi)
    Route::post('/orders', [OrderController::class, 'store']);                    // Beli barang
    Route::get('/orders', [OrderController::class, 'index']);                     // Lihat riwayat
    Route::get('/orders/{id}', [OrderController::class, 'show']);                 // Detail pesanan
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);  // Update status (Penjual)
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancelOrder']);   // Batal (Penjual)
    Route::put('/orders/{id}/cancel-buyer', [OrderController::class, 'cancelOrderByBuyer']); // Batal (Pembeli)

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']); 

    // Keranjang
    Route::get('/keranjang', [KeranjangController::class, 'index']);
    Route::post('/keranjang', [KeranjangController::class, 'store']);

    // Review
    Route::post('/riview', [RiviewController::class, 'store']);

});