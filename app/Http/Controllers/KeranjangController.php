<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\keranjang;
use App\Models\produk;

class keranjangController extends Controller
{

    /**
     * @OA\Get(
     * path="/api/keranjang",
     * tags={"Keranjang"},
     * summary="Lihat Keranjang Belanja",
     * security={{"bearerAuth":{}}},
     * @OA\Response(response=200, description="List Keranjang")
     * )
     */
    //--- Tampilkan Isi Keranjang ---
    public function index(Request $request)
    {
        $keranjangItems = keranjang::where('user_id', $request->user()->id)
                    ->with('produk') 
                    ->latest()
                    ->get();

        return response()->json([
            'success' => true,
            'data' => $keranjangItems
        ]);
    }

    /**
     * @OA\Post(
     * path="/api/keranjang",
     * tags={"Keranjang"},
     * summary="Tambah Barang ke Keranjang",
     * security={{"bearerAuth":{}}},
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * required={"produk_id", "jumlah"},
     * @OA\Property(property="produk_id", type="integer", example=1),
     * @OA\Property(property="jumlah", type="integer", example=2)
     * )
     * ),
     * @OA\Response(response=201, description="Berhasil masuk keranjang")
     * )
     */
    //--- Memasukkan Barang ke Keranjang ---
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
        $existingItem = keranjang::where('user_id', $user->id)
                        ->where('produk_id', $request->produk_id)
                        ->first();

        if ($existingItem) {
            // Jika ada, tambahkan jumlahnya
            $existingItem->jumlah += $request->jumlah;
            $existingItem->save();
        } else {
            
            // Jika belum ada, buat baru
            keranjang::create([
                'user_id'   => $user->id,
                'produk_id' => $request->produk_id,
                'jumlah'    => $request->jumlah
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Produk masuk keranjang']);
    }

    //--- Update Jumlah (Tambah/Kurang di Halaman Keranjang) ---
    public function update(Request $request, $id)
    {
        // Cari Item id
        $item = keranjang::find($id);
        //Check Kepemilikan
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

    //--- Hapus Dari Keranjang ---
    public function destroy(Request $request, $id)
    {
        $item = keranjang::where('id', $id)->where('user_id', $request->user()->id)->first();
        
        if ($item) {
            $item->delete();
            return response()->json(['success' => true, 'message' => 'Item dihapus']);
        }
        
        return response()->json(['message' => 'Gagal menghapus'], 400);
    }
}