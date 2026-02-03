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
    
    Route::get('/admins', [AdminController::class, 'manageAdmins'])->name('admin.list');
    Route::post('/admins', [AdminController::class, 'storeAdmin'])->name('admin.store');
    
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    
    // Chat
    Route::get('/chats/{id?}', [AdminController::class, 'chats'])->name('admin.chats');
    Route::post('/chats/reply/{id}', [AdminController::class, 'sendReply'])->name('admin.chats.reply');
    
    // User Management
    Route::get('/users', [AdminController::class, 'manageUsers'])->name('admin.users');   
    Route::delete('/users/{id}', [AdminController::class, 'destroyUser'])->name('admin.users.delete');
    Route::get('/users/{id}/profile', [AdminController::class, 'showUserProfile'])->name('admin.users.profile');
    
    // Shop & Product
    Route::get('/users/{id}/shop', [AdminController::class, 'showShop'])->name('admin.users.shop');
    Route::get('/products/{id}', [AdminController::class, 'showProduct'])->name('admin.products.show');
    
    // PERBAIKAN 1: Hapus '/admin' disini
    // Aslinya: /admin/users/{id}/shop/orders
    Route::get('/users/{id}/shop/orders', [App\Http\Controllers\AdminController::class, 'showShopOrders'])->name('admin.users.shop.orders');

    // PERBAIKAN 2: Hapus '/admin' di semua route kategori ini
    // Aslinya: /categories (Otomatis jadi /admin/categories karena prefix grup)
    Route::get('/categories', [App\Http\Controllers\AdminCategoryController::class, 'index'])->name('admin.categories.index');
    Route::post('/categories', [App\Http\Controllers\AdminCategoryController::class, 'store'])->name('admin.categories.store');
    Route::put('/categories/{id}', [App\Http\Controllers\AdminCategoryController::class, 'update'])->name('admin.categories.update');
    Route::delete('/categories/{id}', [App\Http\Controllers\AdminCategoryController::class, 'destroy'])->name('admin.categories.destroy');

    // ... route kategori lainnya ...
Route::post('/categories/reorder', [App\Http\Controllers\AdminCategoryController::class, 'reorder'])->name('admin.categories.reorder');
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
