<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DetailPesanan; 
use App\Models\Pesanan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SellerOrderController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $sellerItems = DetailPesanan::with(['produk', 'pesanan.user'])
            ->whereHas('produk', function($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            // Filter 2: Cek status di tabel PESANAN
            ->whereHas('pesanan', function($q) {
                $q->whereNotNull('id');                 
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

    public function notifications()
    {
        $userId = Auth::id();
        $query = $this->newSellerOrderNotificationQuery($userId);

        $unreadCount = (clone $query)->count();
        $items = $query
            ->with(['produk', 'pesanan.user'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function (DetailPesanan $detail) {
                return [
                    'id' => $detail->id,
                    'order_id' => $detail->pesanan_id,
                    'invoice' => $detail->pesanan?->invoice_code,
                    'buyer_name' => $detail->pesanan?->nama_penerima ?: $detail->pesanan?->user?->name,
                    'product_name' => $detail->produk?->nama_barang,
                    'quantity' => $detail->jumlah,
                    'total_harga' => (int) $detail->total_harga,
                    'created_at' => $detail->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'data' => $items,
        ]);
    }

    public function markNotificationsAsRead()
    {
        $updated = $this->newSellerOrderNotificationQuery(Auth::id())->update([
            'seller_seen_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'updated' => $updated,
        ]);
    }

    public function pendingCount()
    {
        $count = $this->pendingSellerOrderQuery(Auth::id())
            ->distinct('pesanan_id')
            ->count('pesanan_id');

        return response()->json([
            'success' => true,
            'pending_count' => $count,
        ]);
    }

    // Update Status per item
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
        
        // --- LOGIKA PENGEMBALIAN STOK
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

        // --- KIRIM WA (GOWA) ---
        if ($request->status == 'accepted') {
            $this->sendAcceptedOrderNotification($pesanan, $detail);
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
                Pesanan::where('id', $pesananId)->delete();
            }

            return response()->json(['success' => true, 'message' => 'Riwayat pesanan berhasil dihapus']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    private function sendAcceptedOrderNotification(Pesanan $pesanan, DetailPesanan $detail): void
    {
        $targetPhone = $this->normalizeWhatsappPhone($pesanan->telepon_penerima);

        if (!$targetPhone) {
            Log::warning('GoWa notification skipped: recipient phone is empty', [
                'order_id' => $pesanan->id,
                'invoice' => $pesanan->invoice_code,
            ]);
            return;
        }

        $customerName = $pesanan->nama_penerima ?: 'Pembeli';
        $invoice = $pesanan->invoice_code ?: '-';
        $total = number_format((int) ($pesanan->grand_total ?: $detail->total_harga), 0, ',', '.');
        $paymentMethod = strtoupper($pesanan->metode_pembayaran ?: '-');
        $deliveryTime = $pesanan->waktu_pengiriman
            ? $pesanan->waktu_pengiriman->timezone(config('app.timezone'))->format('d/m/Y H:i')
            : '-';
        $address = $pesanan->alamat_pengiriman ?: '-';

        $message = "Halo Kak {$customerName},\n\n"
            . "Pesanan Anda dengan invoice *{$invoice}* telah kami *TERIMA* dan sedang dalam proses pengemasan.\n\n"
            . "Total Pesanan: Rp {$total}\n"
            . "Metode Pembayaran: {$paymentMethod}\n"
            . "Estimasi Tiba: {$deliveryTime}\n\n"
            . "Alamat Tujuan:\n{$address}\n\n"
            . "Terima kasih telah berbelanja di PangkalMart!";

        try {
            $response = Http::timeout(15)
                ->withHeaders(['X-Device-Id' => config('services.gowa.device_id')])
                ->post(rtrim(config('services.gowa.url'), '/') . '/send/message', [
                    'phone' => $targetPhone,
                    'message' => $message,
                ]);

            if (!$response->successful()) {
                Log::warning('GoWa notification failed', [
                    'order_id' => $pesanan->id,
                    'invoice' => $invoice,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('GoWa notification error: ' . $e->getMessage(), [
                'order_id' => $pesanan->id,
                'invoice' => $invoice,
            ]);
        }
    }

    private function normalizeWhatsappPhone(?string $phone): ?string
    {
        $phone = preg_replace('/[^0-9]/', '', (string) $phone);

        if ($phone === '') {
            return null;
        }

        if (str_starts_with($phone, '0')) {
            return '62' . substr($phone, 1);
        }

        return $phone;
    }

    private function newSellerOrderNotificationQuery(int $userId)
    {
        return $this->pendingSellerOrderQuery($userId)
            ->whereNull('seller_seen_at');
    }

    private function pendingSellerOrderQuery(int $userId)
    {
        return DetailPesanan::query()
            ->whereHas('produk', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->whereHas('pesanan', function ($query) {
                $query->where('status', 'pending')
                    ->where(function ($sub) {
                        $sub->where('hidden_for_seller', 0)
                            ->orWhereNull('hidden_for_seller');
                    });
            });
    }

}
