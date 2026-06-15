<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\produkController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\keranjangController;
use App\Http\Controllers\RiviewController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\Api\SellerOrderController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Api\OtpResetController;
use App\Http\Controllers\Api\GuestChatController;

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

Route::post('/send-otp', [AuthController::class, 'sendOtp']);

// Produk (Melihat katalog tidak perlu login)
Route::get('/produk', [produkController::class, 'index']);     // List Barang
Route::get('/produk/{id}', [produkController::class, 'show']); // Detail Barang

// Daftar kategori final dari model Decision Tree. Dropdown dashboard tetap boleh memakai ini untuk filter.
Route::get('/categories', function () {
    return response()->json(
        collect(config('product_categories'))->values()->map(function ($category, $index) {
            return [
                'id' => $index + 1,
                'nama_kategori' => $category,
                'urutan' => $index + 1,
            ];
        })
    );
});

Route::get('/kategori', function () {
    return response()->json(config('product_categories'));
});

Route::get('/cek-saya', function (Illuminate\Http\Request $request) {
    // Ambil user dari token yang dikirim
    $user = $request->user();
    
    if (!$user) {
        return 'Anda belum login / Token tidak terbaca';
    }

    return [
        'nama' => $user->name,
        'email' => $user->email,
        'punya_role_admin' => $user->hasRole('admin'),       // Harus TRUE
        'kategori_otomatis' => config('product_categories')
    ];
})->middleware('auth:sanctum');


// ==========================================
// 2. ROUTE PROTECTED (Wajib Login / Punya Token)
// ==========================================

Route::middleware(['auth:sanctum', \App\Http\Middleware\LogUserActivity::class])->group(function () {

    // User Info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Auth & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // FITUR C2C: Buka Toko (Upgrade dari Pembeli ke Penjual)
    Route::post('/open-shop', [ShopController::class, 'openShop']);

    // Route Produk Saya
    Route::get('/my-products', [ProdukController::class, 'userIndex']);

    Route::get('/seller/orders', [SellerOrderController::class, 'index']);
    Route::get('/seller/orders/pending-count', [SellerOrderController::class, 'pendingCount']);
    Route::get('/seller/order-notifications', [SellerOrderController::class, 'notifications']);
    Route::post('/seller/order-notifications/read', [SellerOrderController::class, 'markNotificationsAsRead']);
    Route::put('/seller/orders/{id}', [SellerOrderController::class, 'update']);
    
    // Route Hapus Produk
    Route::delete('/produk/{id}', [ProdukController::class, 'destroy']);

    // Produk (Upload barang - Logic pengecekan "Penjual" ada di Controller)
    Route::post('/produk', [produkController::class, 'store']);
        //->middleware('permission:create products');

    Route::put('/produk/{id}', [ProdukController::class, 'update']);

    

    // Order (Transaksi)
    Route::post('/orders', [OrderController::class, 'store']);                    // Beli barang
    Route::get('/orders', [OrderController::class, 'index']);                     // Lihat riwayat
    Route::get('/orders/{id}', [OrderController::class, 'show']);                 // Detail pesanan
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);  // Update status (Penjual)
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancelOrder']);   // Batal (Penjual)
    Route::put('/orders/{id}/cancel-buyer', [OrderController::class, 'cancelOrderByBuyer']); // Batal (Pembeli)
    Route::post('/orders/{id}/return', [OrderController::class, 'requestReturn']);
    //Route::put('/seller/orders/{id}', [OrderController::class, 'updateStatus']);
    Route::put('/orders/{id}/receive', [OrderController::class, 'markAsReceived']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']); 

    // keranjang
    Route::get('/keranjang', [keranjangController::class, 'index']);
    Route::post('/keranjang', [keranjangController::class, 'store']);
    Route::put('/keranjang/{id}', [App\Http\Controllers\keranjangController::class, 'update']);
    Route::delete('/keranjang/{id}', [App\Http\Controllers\keranjangController::class, 'destroy']);

    // Review
    Route::post('/riview', [RiviewController::class, 'store']);
    Route::post('/reviews', [RiviewController::class, 'store']);
    Route::put('/ulasan/{id}', [RiviewController::class, 'update']);

    Route::delete('/seller/orders/{id}', [OrderController::class, 'destroy']); 
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
    Route::delete('/orders/{id}', [App\Http\Controllers\OrderController::class, 'destroy']);

    Route::get('/chat/conversations', [ChatController::class, 'getConversations']);
    Route::get('/chat/{userId}', [ChatController::class, 'getMessages']); // Ambil pesan
    Route::post('/chat', [ChatController::class, 'sendMessage']);   // Kirim pesan
    Route::put('/chat/read/{senderId}', [App\Http\Controllers\ChatController::class, 'markAsRead']);
    Route::get('/chat/{id}', [ChatController::class, 'showChat']);
    Route::post('/chat/send', [ChatController::class, 'sendMessage']);

    Route::get('/profile', [App\Http\Controllers\AuthController::class, 'getUserProfile']);
    Route::put('/profile', [App\Http\Controllers\AuthController::class, 'updateUserProfile']);

    Route::get('/user/{id}/public-profile', [ProfileController::class, 'showPublicProfile']);

});

Route::post('/forgot-password-otp', [OtpResetController::class, 'sendOtp']);
Route::post('/reset-password-otp', [OtpResetController::class, 'verifyAndReset']);

// --- ROUTE CHAT KHUSUS TAMU (Tanpa Login) ---
Route::get('/guest-chat/{sessionId}', [GuestChatController::class, 'getMessages']);
Route::post('/guest-chat/send', [GuestChatController::class, 'sendMessage']);

// Route untuk Admin membalas Tamu
Route::post('/admin/guest-chats/reply/{sessionId}', [GuestChatController::class, 'replyMessage']);
// Route untuk Admin mengambil chat Tamu
Route::get('/admin/guest-chats/{sessionId}/json', [GuestChatController::class, 'getMessages']);
