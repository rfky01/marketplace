<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Pesanan;
use App\Models\DetailPesanan;
use Illuminate\Validation\Rule;
use App\Models\produk;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{

/**
     * @OA\Post(
     * path="/api/orders",
     * tags={"Order"},
     * summary="Checkout / Buat Pesanan",
     * security={{"bearerAuth":{}}},
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * required={"alamat_pengiriman", "metode_pembayaran"},
     * @OA\Property(property="alamat_pengiriman", type="string", example="Jl. Mawar No 10"),
     * @OA\Property(property="metode_pembayaran", type="string", example="transfer_bank"),
     * @OA\Property(property="catatan", type="string", example="Tolong packing kayu")
     * )
     * ),
     * @OA\Response(response=201, description="Order Berhasil Dibuat")
     * )
     */
    //===> Fitur Checkout (Membuat Pesanan) <===\\
    public function store(Request $request)
    {        
        $validator = Validator::make($request->all(), [
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

        // Jika Validasi Gagal, Paksa Return JSON Error
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi Gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        // Jika Validasi Gagal, Paksa Return JSON Error
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi Gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

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
            
            // Cek Stok Gudang
            if ($produk->stok_barang < $item['jumlah']) {
                return response()->json(['message' => 'Stok barang tidak cukup: ' . $produk->nama_barang], 400);
            }

            // Hitung Subtotal
            $subtotal = $produk->harga_barang * $item['jumlah'];
            $grand_total += $subtotal;

            // Kurangi Stok
            $produk->decrement('stok_barang', $item['jumlah']);

            // Catat ke DetailPesanan
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

    //===> MELIHAT SEMUA PESANAN (History) <===\\
    public function index(Request $request)
    {
        // Definisikan user terlebih dahulu
        $user = $request->user();

        // Ambil data pesanan milik user ini yang BELUM dihapus (hidden_for_buyer = false)
        $orders = Pesanan::where('user_id', $user->id)
            ->where(function($q) {
                $q->where('hidden_for_buyer', 0)
                ->orWhereNull('hidden_for_buyer');
            })
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

    //===>  <===\\
    public function getSellerOrders()
    {
        // Ambil data detail pesanan dimana produknya milik penjual yang sedang login
        $orders = DetailPesanan::with(['pesanan.user', 'produk'])
            ->whereHas('produk', function($q) {
                $q->where('user_id', auth()->id());
            })
            ->whereHas('pesanan', function($q) {
                // Hanya tampilkan jika BELUM dihapus penjual
                $q->where('hidden_for_seller', false); 
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $orders]);
    }

    //===> Melihat Detail Satu Pesanan <===\\
    public function show(Request $request, $id)
    {
        $order = Pesanan::where('id', $id)
            ->where('user_id', $request->user()->id)
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

    //===>  <===\\
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

    //===> UPDATE STATUS (Terima / Tolak / Kirim) <===\\
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

            // Ambil status
            $inputStatus = strtolower($request->status); 

            // Mulai Transaksi Database
            DB::beginTransaction();

            // --- SKENARIO 1: JIKA PENJUAL MENOLAK / MEMBATALKAN ---
            if (in_array($inputStatus, ['ditolak', 'tolak', 'canceled', 'cancel', 'batal', 'canceled by seller'])) {
                
                // Cek agar tidak double refund stok
                if (!in_array($order->status, ['selesai', 'ditolak', 'canceled by seller', 'canceled by buyer'])) {
                    
                    // 1. KEMBALIKAN STOK
                    $this->restoreStock($order); 
                    
                    // 2. Ubah status jadi standar 'canceled by seller'
                    $order->status = 'canceled by seller'; 
                } 
            }
            
            // --- SKENARIO 2: JIKA PENJUAL MENERIMA ---
            else if (in_array($inputStatus, ['accepted', 'terima', 'diterima', 'process', 'proses'])) {
                $order->status = 'accepted';

                // Simpan waktu pengiriman jika ada
                if ($request->has('waktu_pengiriman')) {
                    $order->waktu_pengiriman = $request->waktu_pengiriman;
                }
            }

            // --- SKENARIO 3: STATUS LAIN (Misal: dikirim) ---
            else {
                $order->status = $inputStatus;
            }

            $order->save();
            
            DB::commit(); 

            return response()->json([
                'success' => true, 
                'message' => 'Status pesanan berhasil diperbarui',
                'data' => $order
            ], 200);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
        }
    }

    //===> Penjual Membatalkan Pesanan <===\\
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

            DB::beginTransaction();

            $this->restoreStock($order);

            // Menggunakan 'canceled by buyer'
            $order->status = 'canceled by seller'; 
            $order->save();

            DB::commit();

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

    //===> Pembeli Membatalkan Pesanan Sendiri <===\\
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

    //===> UPDATE FUNGSI DELETE AGAR BISA HAPUS PESANAN BATAL <===\\
    public function destroy(Request $request, $id)
    {
        $pesanan = Pesanan::find($id);
        if (!$pesanan) return response()->json(['message' => 'Tidak ditemukan'], 404);

        $user = $request->user();

        // Jika Pembeli yang menghapus
        if ($user->id == $pesanan->user_id) {
            $pesanan->hidden_for_buyer = 1; 
        } 
        // Jika Penjual yang menghapus
        else {
            $pesanan->hidden_for_seller = 1;
        }

        $pesanan->save();

        return response()->json(['success' => true, 'message' => 'Riwayat berhasil disembunyikan.']);
    }

    //===>  <===\\
    public function destroySellerOrder($id)
    {
        // Cek dulu apakah ID yang dikirim adalah ID Detail
        $detail = DetailPesanan::find($id);
        
        if ($detail) {
            $pesanan = $detail->pesanan;
        } else {
            // Jika tidak, cek apakah ID Pesanan
            $pesanan = Pesanan::find($id);
        }

        if (!$pesanan) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        }

        $pesanan->hidden_for_seller = true;
        $pesanan->save();

        return response()->json(['success' => true, 'message' => 'Riwayat dihapus dari toko Anda.']);
    }

    //===> Fungsi Pembantu untuk Mengembalikan Stok <===\\
    private function restoreStock($pesanan)
    {
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

    //===>  <===\\
    public function requestReturn($id)
    {
        $order = Pesanan::find($id); 

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan'
            ], 404);
        }

        // Cek otorisasi
        if ($order->user_id !== auth()->id()) {
             return response()->json([
                'success' => false,
                'message' => 'Anda tidak berhak melakukan aksi ini'
            ], 403);
        }

        // Update status
        $order->status = 'return_requested'; 
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan return berhasil dikirim',
            'data' => $order
        ], 200);
    }
}