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

    // 1. MELIHAT SEMUA PESANAN (History) - SUDAH DIPERBAIKI
    public function index(Request $request)
    {
        $orders = Pesanan::where('user_id', $request->user()->id)
            // PERBAIKAN: Gunakan 'detailPesanan' (sesuai Model Pesanan.php)
            ->with(['detailPesanan.produk' => function ($query) {
                $query->withTrashed(); 
            }])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar riwayat pesanan Anda',
            'data'    => $orders 
        ]);
    }

    // FITUR 2: Melihat Detail Satu Pesanan - SUDAH DIPERBAIKI
    public function show(Request $request, $id)
    {
        $order = Pesanan::where('id', $id)
            ->where('user_id', $request->user()->id)
            // PERBAIKAN: Gunakan 'detailPesanan'
            ->with(['detailPesanan.produk' => function ($query) {
                $query->withTrashed();
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
    public function cancelOrder(Request $request, $id)
    {
        if ($request->user()->role !== 'penjual') {
            return response()->json(['message' => 'Hanya penjual yang boleh membatalkan'], 403);
        }

        $pesanan = Pesanan::find($id);

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        if ($pesanan->status !== 'pending') {
            return response()->json(['message' => 'Pesanan sudah diproses, tidak bisa batal.'], 400);
        }

        DB::transaction(function () use ($pesanan) {
            $this->restoreStock($pesanan);
            $pesanan->status = 'dibatalkan oleh penjual';
            $pesanan->save();
        });

        return response()->json([
            'message' => 'Pesanan dibatalkan dan stok telah dikembalikan',
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
            $pesanan->status = 'dibatalkan oleh pembeli';
            $pesanan->save();
        });

        return response()->json([
            'message' => 'Anda membatalkan pesanan. Stok barang telah dikembalikan.',
            'data' => $pesanan
        ]);
    }

    // Fungsi Pembantu untuk Mengembalikan Stok - SUDAH DIPERBAIKI
    private function restoreStock($pesanan)
    {
        // PERBAIKAN: Gunakan 'detailPesanan'
        $pesanan->load(['detailPesanan.produk' => function($q) {
            $q->withTrashed();
        }]);

        // PERBAIKAN: Gunakan 'detailPesanan'
        foreach ($pesanan->detailPesanan as $detail) {
            $produk = $detail->produk; 
            
            if ($produk) {
                $produk->stok_barang += $detail->jumlah;
                $produk->save();
            }
        }
    }
}