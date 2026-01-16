<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\produkController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KeranjangController;
use App\Http\Controllers\RiviewController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 1. Route Bawaan (User Info)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// 2. Route Public (Bisa diakses tanpa Login)
Route::get('/produk', [produkController::class, 'index']); // List Barang
Route::get('/produk/{id}', [produkController::class, 'show']); // Detail Barang
Route::post('/register', [AuthController::class, 'register']); // Daftar
Route::post('/login', [AuthController::class, 'login']); // Masuk

// 3. Route Protected (Harus Login / Punya Token)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);

    // produk (Upload barang)
    Route::post('/produk', [produkController::class, 'store']); 

    // Order (Transaksi)
    Route::post('/orders', [OrderController::class, 'store']); // Beli barang
    Route::get('/orders', [OrderController::class, 'index']);  // Lihat riwayat
    Route::get('/orders/{id}', [OrderController::class, 'show']); // Detail pesanan
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancelOrder']);
    Route::put('/orders/{id}/cancel-buyer', [OrderController::class, 'cancelOrderByBuyer']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']); // Cek Omzet

    // Keranjang
    Route::get('/keranjang', [KeranjangController::class, 'index']);
    Route::post('/keranjang', [KeranjangController::class, 'store']);

    // Review (Langsung di sini saja, tidak perlu buat grup middleware baru lagi)
    Route::post('/riview', [RiviewController::class, 'store']);

});