<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ShopController extends Controller
{
    // FUNGSI BUKA TOKO (Upgrade jadi Penjual)
    public function openShop(Request $request)
    {
        $user = $request->user();

        // Cek jika sudah jadi penjual
        if ($user->role === 'penjual') {
            return response()->json(['message' => 'Anda sudah memiliki toko!'], 400);
        }

        // Ubah role jadi penjual
        $user->role = 'penjual';
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Selamat! Toko Anda berhasil dibuka. Sekarang Anda bisa upload produk.',
            'data' => $user
        ]);
    }
}