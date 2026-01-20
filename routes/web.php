<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

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
});

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

require __DIR__.'/auth.php';
