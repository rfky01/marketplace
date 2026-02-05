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
            ->whereHas('produk', function($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            // Filter 2: Cek status di tabel PESANAN (Induk)
            ->whereHas('pesanan', function($q) {
                $q->whereNotNull('id'); 
                
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
    public function update(Request $request, $id)
    {
        // 1. Validasi
        $request->validate([
            'status' => 'required|string'
        ]);

        // 2. Cari Detail Pesanan
        $detail = DetailPesanan::with('pesanan', 'produk')->find($id);

        if (!$detail) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }
        
        // 3. Keamanan
        if($detail->produk->user_id != Auth::id()) {
            return response()->json(['message' => 'Anda tidak berhak mengubah pesanan ini'], 403);
        }

        $pesanan = $detail->pesanan; 
        
        // --- LOGIKA PENGEMBALIAN STOK (BARU) ---
        // Jika status yang dikirim adalah 'canceled by seller' (Ditolak Penjual)
        if ($request->status == 'canceled by seller' || $request->status == 'dibatalkan') {
            
            // Cek dulu, jangan sampai stok dikembalikan 2x jika sudah batal sebelumnya
            if (!in_array($pesanan->status, ['canceled by seller', 'canceled by buyer', 'ditolak'])) {
                
                // Kembalikan Stok Barang
                $produk = $detail->produk;
                $produk->stok_barang = $produk->stok_barang + $detail->jumlah;
                $produk->save();
            }
            
            // Set status jadi 'canceled by seller'
            $pesanan->status = 'canceled by seller';
        } 
        // --- LOGIKA TERIMA / KIRIM ---
        else {
            $pesanan->status = $request->status;
            
            if ($request->has('waktu_pengiriman')) {
                $pesanan->waktu_pengiriman = $request->waktu_pengiriman;
            }
        }
        
        $pesanan->save(); 

        // --- KIRIM WA (FONNTE) ---
        if ($request->status == 'accepted') {
            $targetPhone = $pesanan->telepon_penerima; 
            $customerName = $pesanan->nama_penerima;
            $invoice = $pesanan->invoice_code;
            
            $message = "Halo Kak {$customerName},\n\nPesanan Anda dengan invoice *{$invoice}* telah kami *TERIMA* dan sedang dalam proses pengemasan.\n";
            if($pesanan->waktu_pengiriman){
                 $message .= "Estimasi dikirim: {$pesanan->waktu_pengiriman}\n";
            }
            $message .= "\nTerima kasih telah berbelanja di MarketplacePlus!";

            $curl = curl_init();
            curl_setopt_array($curl, array(
                CURLOPT_URL => 'https://api.fonnte.com/send',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_ENCODING => '',
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30, 
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => array(
                    'target' => $targetPhone,
                    'message' => $message,
                    'countryCode' => '62', 
                ),
                CURLOPT_HTTPHEADER => array(
                    'Authorization: PzkJf4FzoSnZy5ATt9gN' 
                ),
            ));
            $response = curl_exec($curl);
            curl_close($curl);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status berhasil diperbarui'
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
                // Hapus pesanan induk via Model 
                Pesanan::where('id', $pesananId)->delete();
            }

            return response()->json(['success' => true, 'message' => 'Riwayat pesanan berhasil dihapus']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

}