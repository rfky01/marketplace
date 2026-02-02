<?php

use App\Http\Middleware\IsAdmin;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/
Route::post('/login-session', [AuthController::class, 'login']);
Route::middleware(['auth', IsAdmin::class])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    // Tambahkan tanda tanya {id?} agar bisa dibuka tanpa memilih user dulu
    Route::get('/chats/{id?}', [AdminController::class, 'chats'])->name('admin.chats');
    // Route untuk Admin membalas pesan (POST)
    Route::post('/chats/reply/{id}', [AdminController::class, 'sendReply'])->name('admin.chats.reply');
    // Admin melihat daftar user & toko mereka
    Route::get('/users', [AdminController::class, 'manageUsers'])->name('admin.users');   
    // Admin menghapus user (Banned)
    Route::delete('/users/{id}', [AdminController::class, 'destroyUser'])->name('admin.users.delete');
    Route::get('/users/{id}/profile', [AdminController::class, 'showUserProfile'])->name('admin.users.profile');
    // Route untuk melihat daftar produk user (Toko)
    Route::get('/users/{id}/shop', [AdminController::class, 'showShop'])->name('admin.users.shop');
    // Route untuk melihat detail satu produk
    Route::get('/products/{id}', [AdminController::class, 'showProduct'])->name('admin.products.show');
    Route::get('/admin/users/{id}/shop/orders', [App\Http\Controllers\AdminController::class, 'showShopOrders'])->name('admin.users.shop.orders');
});

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::view('/{any}', 'welcome')->where('any', '.*');

    // Route untuk melihat detail profil user
});

Route::get('/{any}', function () {
    return view('welcome'); // Sesuaikan dengan nama file view tempat React di-mount (bisa 'app', 'index', atau 'welcome')
})->where('any', '.*');

Route::get('/kirim-wa', function () {
    $token = env('AL6yaCjsccosjGvVMPpA'); // Mengambil token dari .env
    $target = '085609688462'; // GANTI dengan nomor HP Anda sendiri untuk tes

    $response = Http::withHeaders([
        'Authorization' => $token,
    ])->post('https://api.fonnte.com/send', [
        'target' => $target,
        'message' => "Halo! \nToken Fonnte berhasil terhubung ke Laravel.",
        'countryCode' => '62', 
    ]);

    return $response->json(); // Menampilkan balasan dari Fonnte di layar
});

Route::post('/login-session', [AuthController::class, 'login']);

require __DIR__.'/auth.php';
