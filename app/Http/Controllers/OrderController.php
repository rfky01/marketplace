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
        // 1. Validasi Input
        $request->validate([
            'items' => 'required|array',
            'items.*.produk_id' => 'required|exists:produk,id', // Pastikan nama tabel benar
            'items.*.jumlah' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            // --- BUAT PESANAN UTAMA (HEADER) ---
            $invoice = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $pesanan = Pesanan::create([
                'user_id'      => $request->user()->id,
                'invoice_code' => $invoice,
                'tanggal'      => now(),
                'status'       => 'pending',
                'grand_total'  => 0 // Nilai awal 0
            ]);

            // 2. Hitung Total Harga & Simpan Detail
            $grandTotal = 0;

            foreach ($request->items as $item) {
                // Cari produk
                $produk = produk::find($item['produk_id']);

                // Cek Stok
                if (!$produk || $produk->stok_barang < $item['jumlah']) {
                    DB::rollBack();
                    return response()->json(['message' => 'Stok habis untuk barang: ' . $produk->nama_barang], 400);
                }

                // HITUNG SUBTOTAL
                $subtotal = $produk->harga_barang * $item['jumlah'];

                // Simpan Detail Pesanan
                DetailPesanan::create([
                    'pesanan_id'  => $pesanan->id,
                    'produk_id'   => $item['produk_id'],
                    'jumlah'      => $item['jumlah'],
                    'total_harga' => $subtotal
                ]);

                // Kurangi stok produk
                $produk->decrement('stok_barang', $item['jumlah']);

                // Tambahkan ke Grand Total
                $grandTotal += $subtotal;
            }

            // Update Total Harga di Pesanan Utama
            $pesanan->update(['grand_total' => $grandTotal]);

            DB::commit();

            // BARIS INI YANG TADI ERROR (Sekarang sudah diperbaiki)
            return response()->json(['message' => 'Pesanan berhasil dibuat', 'data' => $pesanan]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat pesanan: ' . $e->getMessage()], 500);
        }
    }

    // ... method store ada di atas sini ...

    // 1. MELIHAT SEMUA PESANAN (History)
    public function index(Request $request)
    {
        // Ambil semua pesanan milik user yang sedang login
        $orders = Pesanan::where('user_id', $request->user()->id)
                         ->orderBy('created_at', 'desc') // Urutkan dari yang terbaru
                         ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar riwayat pesanan Anda',
            'data'    => $orders 
            // Field 'status' akan otomatis muncul di dalam data ini
        ]);
    }

    // FITUR 2: Melihat Detail Satu Pesanan (Optional tapi berguna)
    public function show(Request $request, $id)
    {
        // Cari pesanan berdasarkan ID DAN pastikan milik user tersebut
        $order = Pesanan::where('id', $id)
                        ->where('user_id', $request->user()->id)
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

    public function updateStatus(Request $request, $id)
    {
        // 1. Cek apakah user adalah PENJUAL?
        // (Asumsi di tabel user ada kolom 'role')
        if ($request->user()->role !== 'penjual') {
            return response()->json(['message' => 'Hanya penjual yang boleh mengubah status'], 403);
        }

        // 2. Validasi input status
        $request->validate([
            'status' => ['required', 'in:accepted,dikirim,selesai']
        ]);

        // 3. Cari Pesanan
        $pesanan = Pesanan::find($id);

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        // 4. Logika Perubahan Status (Optional: Agar alurnya rapi)
        // Contoh: Tidak boleh langsung loncat dari 'pending' ke 'selesai' tanpa 'accepted'
        // Tapi untuk sekarang kita buat fleksibel dulu sesuai request Anda.
        
        $pesanan->status = $request->status;
        $pesanan->save();

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui',
            'data' => $pesanan
        ]);
    }

    // ... method lainnya ...

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

        // --- MULAI TRANSAKSI DATABASE ---
        DB::transaction(function () use ($pesanan) {
            // 1. Kembalikan Stok
            $this->restoreStock($pesanan);

            // 2. Ubah Status
            $pesanan->status = 'dibatalkan oleh penjual';
            $pesanan->save();
        });
        // --- SELESAI TRANSAKSI ---

        return response()->json([
            'message' => 'Pesanan dibatalkan dan stok telah dikembalikan',
            'data' => $pesanan->load('detailPesanan.Produk') // Tampilkan detail barangnya
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

        // --- MULAI TRANSAKSI DATABASE ---
        DB::transaction(function () use ($pesanan) {
            // 1. Kembalikan Stok
            $this->restoreStock($pesanan);

            // 2. Ubah Status
            $pesanan->status = 'dibatalkan oleh pembeli';
            $pesanan->save();
        });
        // --- SELESAI TRANSAKSI ---

        return response()->json([
            'message' => 'Anda membatalkan pesanan. Stok barang telah dikembalikan.',
            'data' => $pesanan->load('detailPesanan.Produk')
        ]);
    }

    // Fungsi Pembantu untuk Mengembalikan Stok
    private function restoreStock($pesanan)
    {
        // Ambil detail pesanan beserta produknya
        $pesanan->load('detailPesanan.Produk');

        foreach ($pesanan->detailPesanan as $detail) {
            $produk = $detail->Produk; // Mengambil data produk terkait
            
            if ($produk) {
                // Tambahkan stok lama dengan jumlah yang dibatalkan
                $produk->stok_barang += $detail->jumlah;  // Gunakan 'stok_barang' sesuai database 
                $produk->save();
            }
        }
    }
}