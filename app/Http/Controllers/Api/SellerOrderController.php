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

        $sellerItems = DetailPesanan::with(['produk', 'pesanan.user'])
            // Filter 1: Pastikan produknya milik penjual yang login
            ->whereHas('produk', function($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            // Filter 2: Cek status di tabel PESANAN (Induk)
            ->whereHas('pesanan', function($q) {
                $q->whereNotNull('id'); 
                
                // --- PERBAIKAN DISINI ---
                // Filter ini HARUS di dalam whereHas('pesanan'), karena kolomnya ada di tabel pesanan
                // Kita gunakan logic OR NULL agar data lama tetap muncul
                $q->where(function($sub) {
                    $sub->where('hidden_for_seller', 0)
                        ->orWhereNull('hidden_for_seller');
                });
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

        if ($request->has('waktu_pengiriman')) {
            $order->waktu_pengiriman = $request->waktu_pengiriman;
        }
        
        $order->save();

        // --- TAMBAHAN: KIRIM WA VIA FONNTE (HANYA JIKA STATUS 'ACCEPTED') ---
        if ($request->status == 'accepted') {
            $targetPhone = $order->telepon_penerima; // Pastikan kolom ini ada di tabel orders
            $customerName = $order->nama_penerima;
            $invoice = $order->invoice_code;
            
            $message = "Halo Kak {$customerName},\n\nPesanan Anda dengan invoice *{$invoice}* telah kami *TERIMA* dan sedang dalam proses pengemasan.\nEstimasi dikirim: {$order->waktu_pengiriman}\n\nTerima kasih telah berbelanja di MarketplacePlus!";

            $curl = curl_init();

            curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://api.fonnte.com/send',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => array(
                'target' => $targetPhone,
                'message' => $message,
                'countryCode' => '62', // Optional
            ),
            CURLOPT_HTTPHEADER => array(
                'Authorization: GANTI_DENGAN_TOKEN_FONNTE_ASLI_ANDA' // <--- GANTI INI
            ),
            ));

            $response = curl_exec($curl);
            curl_close($curl);
        }
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