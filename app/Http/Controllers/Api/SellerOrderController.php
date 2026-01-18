<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DetailPesanan; // Pastikan model DetailPesanan ada
use Illuminate\Support\Facades\Auth;

class SellerOrderController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        // 1. Cari Detail Pesanan dimana Produknya adalah milik User yang sedang login (Penjual)
        $sellerItems = DetailPesanan::with(['produk', 'pesanan'])
            ->whereHas('produk', function($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            // Hanya ambil pesanan yang statusnya BUKAN 'keranjang' (sudah di-checkout)
            // Sesuaikan dengan logika checkout Anda, biasanya pesanan yang masuk tabel 'pesanan' sudah fix
            ->whereHas('pesanan', function($q) {
                $q->whereNotNull('id'); 
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sellerItems
        ]);
    }

    // Opsional: Update Status per item (Misal: Sedang Dikemas, Dikirim)
    // ... code sebelumnya ...

    public function update(Request $request, $id)
    {
        // Validasi input status
        $request->validate([
            'status' => 'required|string'
        ]);

        // 1. Cari Detail Pesanan berdasarkan ID
        $detail = DetailPesanan::with('pesanan', 'produk')->find($id);

        if (!$detail) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }
        
        // 2. Keamanan: Pastikan yang mengubah adalah Penjual asli barang tersebut
        if($detail->produk->user_id != Auth::id()) {
            return response()->json(['message' => 'Anda tidak berhak mengubah pesanan ini'], 403);
        }

        // 3. Update Status pada Tabel PESANAN Induk
        // Catatan: Ini akan mengubah status invoice utama.
        $pesanan = $detail->pesanan;
        $pesanan->status = $request->status;
        $pesanan->save();
        
        return response()->json([
            'success' => true, 
            'message' => 'Status pesanan berhasil diubah menjadi ' . $request->status
        ]);
    }
}