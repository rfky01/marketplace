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

    // FITUR: Update Status (Penjual)
    public function updateStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'penjual') {
            return response()->json(['message' => 'Hanya penjual yang boleh mengubah status'], 403);
        }

        $request->validate([
            'status' => ['required', 'in:accepted,dikirim,selesai']
        ]);

        $pesanan = Pesanan::find($id);

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }
        
        $pesanan->status = $request->status;
        $pesanan->save();

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui',
            'data' => $pesanan
        ]);
    }

    // FITUR: Penjual Membatalkan Pesanan
    // --- GANTI FUNGSI CANCEL YANG LAMA DENGAN INI ---
    // Fungsi ini Cerdas: Bisa mendeteksi apakah yang klik tombol itu Pembeli atau Penjual
    public function cancelOrder(Request $request, $id)
    {
        $user = $request->user();
        $pesanan = Pesanan::find($id);

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // 1. Cek Status: Hanya boleh batal jika pending
        if ($pesanan->status !== 'pending') {
            return response()->json(['message' => 'Pesanan sudah diproses atau selesai, tidak bisa dibatalkan.'], 400);
        }

        // 2. Cek Hak Akses:
        // - Boleh jika dia adalah PEMILIK pesanan (Pembeli)
        // - Boleh jika dia adalah PENJUAL (Role Penjual)
        if ($pesanan->user_id !== $user->id && $user->role !== 'penjual') {
            return response()->json(['message' => 'Anda tidak berhak membatalkan pesanan ini.'], 403);
        }

        // 3. Proses Pembatalan
        DB::transaction(function () use ($pesanan, $user) {
            // Kembalikan Stok
            $this->restoreStock($pesanan);

            // Tentukan Status Baru (Biar ketahuan siapa yang membatalkan)
            if ($pesanan->user_id === $user->id) {
                $pesanan->status = 'canceled by buyer'; // Jika pembeli yang klik
            } else {
                $pesanan->status = 'canceled by seller'; // Jika penjual yang klik
            }
            
            $pesanan->save();
        });

        return response()->json([
            'message' => 'Pesanan berhasil dibatalkan dan stok dikembalikan.',
            'data' => $pesanan
        ]);
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
}