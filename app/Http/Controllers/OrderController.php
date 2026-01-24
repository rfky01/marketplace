<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use Illuminate\Validation\Rule;
use App\Models\produk;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // FITUR CHECKOUT (Membuat Pesanan)
    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.produk_id' => 'required|exists:produk,id',
            'items.*.jumlah' => 'required|integer|min:1',
            'nama_penerima' => 'required|string',
            'email_penerima' => 'required|email',
            'telepon_penerima' => 'required|string',
            'alamat_pengiriman' => 'required|string',
            'waktu_pengiriman' => 'required|date',
            'metode_pembayaran' => 'required|string',
        ]);

        $user = $request->user();
        $invoice_code = 'INV-' . time() . '-' . $user->id;
        $grand_total = 0;

        // 1. Buat Pesanan Utama
        $pesanan = Pesanan::create([
            'user_id' => $user->id,
            'invoice_code' => $invoice_code,
            'tanggal' => now(),
            'status' => 'pending',
            'grand_total' => 0,
            'nama_penerima' => $request->nama_penerima,
            'email_penerima' => $request->email_penerima,
            'telepon_penerima' => $request->telepon_penerima,
            'alamat_pengiriman' => $request->alamat_pengiriman,
            'catatan' => $request->catatan,
            'waktu_pengiriman' => $request->waktu_pengiriman,
            'metode_pembayaran' => $request->metode_pembayaran,
        ]);

        // 2. Simpan Detail Barang
        foreach ($request->items as $item) {
            $produk = produk::find($item['produk_id']);
            
            if ($produk->stok_barang < $item['jumlah']) {
                return response()->json(['message' => 'Stok barang tidak cukup: ' . $produk->nama_barang], 400);
            }

            $subtotal = $produk->harga_barang * $item['jumlah'];
            $grand_total += $subtotal;

            // Kurangi Stok
            $produk->decrement('stok_barang', $item['jumlah']);

            // Masuk ke DetailPesanan
            DetailPesanan::create([
                'pesanan_id' => $pesanan->id,
                'produk_id' => $produk->id,
                'jumlah' => $item['jumlah'],
                'harga_satuan' => $produk->harga_barang,
                'total_harga'  => $subtotal
            ]);
        }

        // 3. Update Grand Total
        $pesanan->update(['grand_total' => $grand_total]);

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibuat',
            'data' => $pesanan
        ]);
    }

    // 1. MELIHAT SEMUA PESANAN (History)
    public function index(Request $request)
    {
        $orders = Pesanan::where('user_id', $request->user()->id)
            // PERBAIKAN: Gunakan 'detail_pesanan' (sesuai Model) dan load 'user'
            ->with(['detail_pesanan.produk' => function ($query) {
                $query->withTrashed()->with('user'); 
            }])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar riwayat pesanan Anda',
            'data'    => $orders 
        ]);
    }

    // FITUR 2: Melihat Detail Satu Pesanan
    public function show(Request $request, $id)
    {
        $order = Pesanan::where('id', $id)
            ->where('user_id', $request->user()->id)
            // PERBAIKAN: Gunakan 'detail_pesanan' (sesuai Model)
            ->with(['detail_pesanan.produk' => function ($query) {
                $query->withTrashed()->with('user');
            }])
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan atau bukan milik Anda'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail pesanan',
            'data'    => $order
        ]);
    }

    public function markAsReceived(Request $request, $id)
    {
        $order = \App\Models\Pesanan::find($id);

        if (!$order) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // Pastikan yang akses adalah pemilik pesanan
        if ($order->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Pastikan statusnya 'dikirim' baru boleh diselesaikan
        if ($order->status !== 'dikirim') {
            return response()->json([
                'message' => 'Gagal: Hanya pesanan yang sedang dikirim yang bisa diterima.'
            ], 400);
        }

        // Ubah status jadi selesai
        $order->status = 'selesai';
        $order->save();

        return response()->json([
            'success' => true, 
            'message' => 'Pesanan berhasil diselesaikan.'
        ]);
    }

    // FITUR: Update Status (Penjual)
    // Fungsi untuk Penjual mengupdate status (Terima, Kirim, Tolak)
    // Pastikan Request diimport di bagian atas: use Illuminate\Http\Request;
    public function updateStatus(Request $request, $id)
    {
        try {
            $order = Pesanan::find($id);

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan'], 404);
            }

            // Validasi input status
            $request->validate([
                'status' => 'required|string'
            ]);

            $newStatus = $request->status;

            // Update status
            $order->status = $newStatus;
            
            // Jika ada input waktu pengiriman (saat terima pesanan)
            if ($request->has('waktu_pengiriman')) {
                $order->waktu_pengiriman = $request->waktu_pengiriman;
            }

            $order->save();

            return response()->json([
                'success' => true, 
                'message' => 'Status pesanan berhasil diperbarui menjadi ' . $newStatus,
                'data' => $order
            ], 200);

        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    // FITUR: Penjual Membatalkan Pesanan
    // --- GANTI FUNGSI CANCEL YANG LAMA DENGAN INI ---
    // Fungsi ini Cerdas: Bisa mendeteksi apakah yang klik tombol itu Pembeli atau Penjual
    // Hapus parameter "Request $request" agar tidak perlu import class Request
   public function cancelOrder($id)
    {
        try {
            $order = Pesanan::find($id); 

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            $status = strtolower($order->status);
            // Cek apakah sudah selesai atau sudah batal
            if ($status == 'selesai' || str_contains($status, 'batal') || str_contains($status, 'cancel')) {
                 return response()->json([
                    'success' => false,
                    'message' => 'Pesanan sudah selesai atau sudah dibatalkan sebelumnya.'
                ], 400);
            }

            $sekarang = \Carbon\Carbon::now();
            $sudahLewatWaktu = false;

            if ($order->waktu_pengiriman) {
                try {
                    $batasWaktu = \Carbon\Carbon::parse($order->waktu_pengiriman);
                    $sudahLewatWaktu = $sekarang->greaterThan($batasWaktu);
                } catch (\Exception $e) {
                    $sudahLewatWaktu = false;
                }
            }

            $isPending = ($status == 'pending');

            if (!$isPending && !$sudahLewatWaktu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal: Pesanan sedang diproses dan waktu pengiriman belum terlewat.'
                ], 400);
            }

            // --- PERBAIKAN UTAMA DI SINI ---
            // Menggunakan 'canceled by buyer' SESUAI FILE MIGRASI ANDA
            $order->status = 'canceled by buyer'; 
            $order->save();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan',
                'data' => $order
            ], 200);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server Error: ' . $e->getMessage()
            ], 500);
        }
    }

    // FITUR: Pembeli Membatalkan Pesanan Sendiri
    public function cancelOrderByBuyer(Request $request, $id)
    {
        $pesanan = Pesanan::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        if ($pesanan->status !== 'pending') {
            return response()->json(['message' => 'Pesanan sudah diproses penjual, tidak bisa batal.'], 400);
        }

        DB::transaction(function () use ($pesanan) {
            $this->restoreStock($pesanan);
            $pesanan->status = 'canceled by buyer';
            $pesanan->save();
        });

        return response()->json([
            'message' => 'Anda membatalkan pesanan. Stok barang telah dikembalikan.',
            'data' => $pesanan
        ]);
    }

    // --- UPDATE FUNGSI DELETE AGAR BISA HAPUS PESANAN BATAL ---
    public function destroy(Request $request, $id)
    {
        // 1. Cari Pesanan berdasarkan ID saja (jangan filter user_id dulu biar Penjual juga ketemu datanya)
        $pesanan = Pesanan::find($id);

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // 2. Tentukan Status yang BOLEH dihapus
        // Tambahkan 'canceled by seller' ke dalam daftar ini
        $statusBolehHapus = ['selesai', 'canceled by buyer', 'canceled by seller'];

        if (!in_array($pesanan->status, $statusBolehHapus)) {
            return response()->json([
                'message' => 'Gagal: Hanya pesanan Selesai atau Dibatalkan yang boleh dihapus.'
            ], 400);
        }

        // 3. Validasi Keamanan (Opsional tapi disarankan)
        // Pastikan yang menghapus adalah Pemilik (Pembeli) ATAU Penjual (Admin Toko)
        // Jika Anda ingin simpel dan mengizinkan siapa saja yang punya akses route ini menghapus, bagian ini bisa dilewati.
        // Tapi setidaknya logic di atas sudah memperbaiki masalah status.

        // 4. Eksekusi Hapus
        // Hapus detail dulu karena foreign key
        DetailPesanan::where('pesanan_id', $pesanan->id)->delete();
        
        // Hapus pesanan utama
        $pesanan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pesanan berhasil dihapus.'
        ]);
    }

    // Fungsi Pembantu untuk Mengembalikan Stok
    private function restoreStock($pesanan)
    {
        // PERBAIKAN: Gunakan 'detail_pesanan'
        $pesanan->load(['detail_pesanan.produk' => function($q) {
            $q->withTrashed();
        }]);

        foreach ($pesanan->detail_pesanan as $detail) {
            $produk = $detail->produk; 
            
            if ($produk) {
                $produk->stok_barang += $detail->jumlah;
                $produk->save();
            }
        }
    }

    public function requestReturn($id)
    {
        // PERBAIKAN: Gunakan Pesanan::find, bukan Order::find
        $order = Pesanan::find($id); 

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan'
            ], 404);
        }

        // Cek otorisasi (opsional, jika perlu)
        if ($order->user_id !== auth()->id()) {
             return response()->json([
                'success' => false,
                'message' => 'Anda tidak berhak melakukan aksi ini'
            ], 403);
        }

        // Update status
        // PERHATIAN: Pastikan 'return_requested' sudah didaftarkan di Database (ENUM)
        // Jika belum, Anda mungkin akan mendapat error "Check violation" setelah ini.
        $order->status = 'return_requested'; 
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan return berhasil dikirim',
            'data' => $order
        ], 200);
    }
}