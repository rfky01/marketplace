<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Keranjang;

class KeranjangController extends Controller
{
    // Lihat isi keranjang user yang sedang login
    public function index()
    {
        $data = Keranjang::where('user_id', auth()->id())->get();
        
        return response()->json([
            'message' => 'Isi Keranjang Anda',
            'data' => $data
        ]);
    }

    // Tambah barang ke keranjang
    public function store(Request $request)
    {
        // Validasi input
        $request->validate([
            'produk_id' => 'required',
            'jumlah' => 'required|integer'
        ]);

        // Simpan ke tabel 'keranjang'
        $item = Keranjang::create([
            'user_id' => auth()->id(),       // Ambil ID user otomatis
            'produk_id' => $request->produk_id,
            'jumlah' => $request->jumlah
        ]);

        return response()->json([
            'message' => 'Berhasil masuk keranjang',
            'data' => $item
        ]);
    }
}