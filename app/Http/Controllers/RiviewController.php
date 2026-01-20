<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Riview;
use App\Models\Pesanan;
use App\Models\DetailPesanan; // Perlu import model ini
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class RiviewController extends Controller
{
    public function store(Request $request)
    {
        // 1. VALIDASI (Disesuaikan dengan data dari React)
        $request->validate([
            'pesanan_id' => 'required', // Hapus 'exists' dulu biar aman jika nama tabel beda
            'rating'     => 'required|integer|min:1|max:5',
            'comment'   => 'required|string', // React mengirim 'comment', kita terima 'comment'
        ]);

        $userId = Auth::id();

        // 2. CARI PESANAN
        // Kita butuh relasi 'detail_pesanan' untuk tahu produk apa saja yang dibeli
        // Pastikan model Pesanan punya method: public function detail_pesanan() { ... }
        $pesanan = Pesanan::with('detail_pesanan')->where('id', $request->pesanan_id)
                    ->where('user_id', $userId)
                    ->first();

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // 3. SIMPAN ULASAN
        // Karena React mengirim ulasan per-pesanan, kita simpan ulasan yang sama
        // untuk SETIAP produk yang ada di dalam pesanan tersebut.
        
        $jumlahTersimpan = 0;

        // Cek jika detail pesanan kosong
        if (!$pesanan->detail_pesanan || $pesanan->detail_pesanan->isEmpty()) {
             return response()->json(['message' => 'Data produk dalam pesanan tidak ditemukan'], 400);
        }

        foreach ($pesanan->detail_pesanan as $detail) {
            
            // Cek Duplikat: Supaya tidak review dobel untuk produk yang sama
            $sudahAda = Riview::where('user_id', $userId)
                        ->where('pesanan_id', $pesanan->id)
                        ->where('produk_id', $detail->produk_id)
                        ->exists();

            if (!$sudahAda) {
                Riview::create([
                    'user_id'    => $userId,
                    'pesanan_id' => $pesanan->id,
                    'produk_id'  => $detail->produk_id, // Ambil ID Produk otomatis dari sini
                    'rating'     => $request->rating,
                    
                    // MAPPING PENTING: 
                    // Data dari React ('comment') dimasukkan ke kolom DB ('comment')
                    'comment'    => $request->comment, 
                ]);
                $jumlahTersimpan++;
            }
        }

        if ($jumlahTersimpan > 0) {
            return response()->json([
                'success' => true,
                'message' => 'Ulasan berhasil disimpan.'
            ], 201);
        } else {
            return response()->json([
                'success' => false, // Ubah jadi false agar React tahu ini gagal logic (bukan koneksi)
                'message' => 'Anda sudah mengulas pesanan ini.'
            ], 400);
        }
    }
}