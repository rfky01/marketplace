<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DetailPesanan; 
use App\Models\Pesanan;
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

    public function destroy($id)
    {
        // 1. Cari detail pesanan
        $detail = DetailPesanan::with(['produk', 'pesanan'])->find($id);

        if (!$detail) {
            return response()->json(['message' => 'Data pesanan tidak ditemukan'], 404);
        }

        // 2. Cek Kepemilikan (Security Check)
        if ($detail->produk->user_id != Auth::id()) {
            return response()->json(['message' => 'Anda tidak memiliki izin menghapus ini'], 403);
        }

        // 3. Cek Status (Hanya boleh hapus jika statusnya batal/selesai)
        // Gunakan strtolower agar huruf besar/kecil tidak masalah
        $status = strtolower($detail->pesanan->status);
        $allowedStatuses = ['dibatalkan', 'dibatalkan oleh pembeli', 'dikirim', 'selesai'];

        if (!in_array($status, $allowedStatuses)) {
            return response()->json([
                'message' => 'Gagal: Pesanan status "' . $detail->pesanan->status . '" tidak boleh dihapus.'
            ], 400);
        }

        // Simpan ID pesanan induk sebelum menghapus detail
        $pesananId = $detail->pesanan_id;

        try {
            // 4. Hapus Detail Pesanan
            $detail->delete();

            // 5. Cek apakah pesanan induk jadi kosong? Jika ya, hapus juga induknya.
            $sisaItem = DetailPesanan::where('pesanan_id', $pesananId)->count();
            
            if ($sisaItem == 0) {
                // Hapus pesanan induk via Model (pastikan import App\Models\Pesanan di atas)
                Pesanan::where('id', $pesananId)->delete();
            }

            return response()->json(['success' => true, 'message' => 'Riwayat pesanan berhasil dihapus']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

}