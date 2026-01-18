<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Riview;
use App\Models\Pesanan;
use App\Models\DetailPesanan; // Perlu import model ini
use Illuminate\Support\Facades\Auth;

class RiviewController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validasi Input Dasar
        $request->validate([
            'produk_id'  => 'required|exists:produk,id',
            'pesanan_id' => 'required|exists:pesanan,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'     => 'required|string',
        ]);

        $userId = Auth::id();

        // 2. LOGIKA VALIDASI PEMBELIAN (PENTING!)

        // A. Cek apakah Pesanan milik User & Statusnya sudah 'finished'
        // 'finished' harus disesuaikan dengan enum status di database Anda (misal: 'completed', 'done', 'success')
        // Jika status di database Anda saat ini masih 'pending', ganti 'finished' jadi 'pending' dulu untuk tes.
        $pesanan = Pesanan::where('id', $request->pesanan_id)
                    ->where('user_id', $userId)
                    ->first();

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan atau bukan milik Anda'], 404);
        }

        // Uncomment baris di bawah ini jika ingin memaksa status harus finished dulu baru bisa riview
        /*
        if ($pesanan->status !== 'finished') {
            return response()->json(['message' => 'Anda baru bisa riview setelah pesanan finished'], 400);
        }
        */

        // B. Cek apakah User BENAR-BENAR membeli produk tersebut di Pesanan ini
        // Kita cek ke tabel detail_pesanan
        $cekBeli = DetailPesanan::where('pesanan_id', $pesanan->id)
                    ->where('produk_id', $request->produk_id) // Sesuaikan 'produk_id' dengan kolom di DB Anda
                    ->exists();

        if (!$cekBeli) {
            return response()->json(['message' => 'Anda tidak membeli produk ini pada pesanan tersebut'], 403);
        }

        // C. Cek apakah User SUDAH PERNAH riview produk ini di pesanan ini (Supaya tidak spam)
        $sudahRiview = Riview::where('user_id', $userId)
                        ->where('pesanan_id', $request->pesanan_id)
                        ->where('produk_id', $request->produk_id)
                        ->exists();

        if ($sudahRiview) {
            return response()->json(['message' => 'Anda sudah memberikan riview untuk produk ini'], 400);
        }

        // 3. Simpan riview (Jika semua lolos)
        $riview = Riview::create([
            'user_id'    => $userId,
            'produk_id'  => $request->produk_id,
            'pesanan_id' => $request->pesanan_id,
            'rating'     => $request->rating,
            'comment'     => $request->comment,
        ]);

        return response()->json([
            'message' => 'Terima kasih! riview berhasil ditambahkan',
            'data'    => $riview
        ], 201);
    }
}