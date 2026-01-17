<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Keranjang;
use App\Models\produk;

class KeranjangController extends Controller
{
    // 1. TAMPILKAN ISI KERANJANG
    public function index(Request $request)
    {
        $cartItems = Keranjang::where('user_id', $request->user()->id)
                    ->with('produk') // Load data produk (nama, harga, gambar)
                    ->latest()
                    ->get();

        return response()->json([
            'success' => true,
            'data' => $cartItems
        ]);
    }

    // 2. TAMBAH KE KERANJANG
    public function store(Request $request)
    {
        $request->validate([
            'produk_id' => 'required|exists:produk,id',
            'jumlah'    => 'required|integer|min:1'
        ]);

        $user = $request->user();
        $produk = produk::find($request->produk_id);

        // Cek stok
        if ($produk->stok_barang < $request->jumlah) {
            return response()->json(['message' => 'Stok tidak mencukupi'], 400);
        }

        // Cek apakah barang sudah ada di keranjang user?
        $existingItem = Keranjang::where('user_id', $user->id)
                        ->where('produk_id', $request->produk_id)
                        ->first();

        if ($existingItem) {
            // Jika ada, tambahkan jumlahnya
            $existingItem->jumlah += $request->jumlah;
            $existingItem->save();
        } else {
            // Jika belum ada, buat baru
            Keranjang::create([
                'user_id'   => $user->id,
                'produk_id' => $request->produk_id,
                'jumlah'    => $request->jumlah
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Produk masuk keranjang']);
    }

    // 3. UPDATE JUMLAH (Tambah/Kurang di halaman Keranjang)
    public function update(Request $request, $id)
    {
        $item = Keranjang::find($id);
        if (!$item || $item->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Item tidak ditemukan'], 404);
        }

        $request->validate(['jumlah' => 'required|integer|min:1']);
        
        // Cek stok lagi
        if ($item->produk->stok_barang < $request->jumlah) {
            return response()->json(['message' => 'Stok maksimal tercapai'], 400);
        }

        $item->jumlah = $request->jumlah;
        $item->save();

        return response()->json(['success' => true]);
    }

    // 4. HAPUS DARI KERANJANG
    public function destroy(Request $request, $id)
    {
        $item = Keranjang::where('id', $id)->where('user_id', $request->user()->id)->first();
        
        if ($item) {
            $item->delete();
            return response()->json(['success' => true, 'message' => 'Item dihapus']);
        }
        
        return response()->json(['message' => 'Gagal menghapus'], 400);
    }
}