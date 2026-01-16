<?php

namespace App\Http\Controllers;

use App\Models\produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProdukController extends Controller
{
    // 1. MENAMPILKAN SEMUA PRODUK (Public)
    // Fitur: Bisa Search nama & Filter kategori
    public function index(Request $request)
    {
        $query = produk::query();

        // Fitur Filter Kategori (Gunakan 'kategori' sesuai database)
        if ($request->has('category')) {
            $query->where('kategori', $request->category);
        }

        // Fitur Search Nama (Gunakan 'nama_barang' sesuai database)
        if ($request->has('search')) {
            $query->where('nama_barang', 'like', '%' . $request->search . '%');
        }

        // Ambil data terbaru
        $products = $query->latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar Data Produk',
            'data'    => $products
        ]);
    }

    // 2. MENAMPILKAN DETAIL 1 PRODUK
    public function show($id)
    {
        $produk = produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $produk
        ]);
    }

    // 3. UPLOAD BARANG BARU (Khusus Penjual)
    public function store(Request $request)
    {
        $request->validate([
            'nama_barang'  => 'required|string',
            'harga_barang' => 'required|integer',
            'stok_barang'  => 'required|integer',
            'kategori'     => 'required|string',
            'deskripsi'    => 'required|string',
            'foto_barang'  => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Upload Gambar
        $imagePath = null;
        if ($request->hasFile('foto_barang')) {
            $imagePath = $request->file('foto_barang')->store('products', 'public');
        }

        // Simpan ke Database
        $produk = produk::create([
            'user_id'      => $request->user()->id,
            'nama_barang'  => $request->nama_barang,
            'harga_barang' => $request->harga_barang,
            'stok_barang'  => $request->stok_barang,
            'kategori'     => $request->kategori,
            'deskripsi'    => $request->deskripsi,
            'foto_barang'  => $imagePath ? url('storage/' . $imagePath) : null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil diposting!',
            'data'    => $produk
        ]);
    }

    // 4. HAPUS BARANG
    public function destroy(Request $request, $id)
    {
        $produk = produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        // Cek Kepemilikan (Gunakan 'user_id' sesuai database, bukan seller_id)
        if ($request->user()->id !== $produk->user_id) {
            return response()->json(['message' => 'Anda dilarang menghapus barang orang lain'], 403);
        }

        $produk->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil dihapus'
        ]);
    }
}