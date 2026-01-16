<?php

namespace App\Http\Controllers;

use App\Models\produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class produkController extends Controller
{
    // MENAMPILKAN SEMUA produk (Public)
    public function index(Request $request)
    {
        $query = produk::query();

        // Fitur Filter Kategori
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Fitur Search Nama
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get()
        ]);
    }

    // MENAMPILKAN DETAIL 1 produk
    public function show($id)
    {
        $produk = produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'produk tidak ditemukan'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $produk
        ]);
    }

    // UPLOAD BARANG BARU (Khusus Penjual)
    public function store(Request $request)
    {
        // 1. Ganti Validasi jadi Bahasa Indonesia (sesuai Postman Anda)
        $request->validate([
            'nama_barang' => 'required|string',   // Bukan 'name' lagi
            'harga_barang' => 'required|integer', // Bukan 'price' lagi
            'stok_barang' => 'required|integer',  
            'kategori' => 'required|string',      
            'deskripsi' => 'required|string',
            'foto_barang' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Upload Gambar
        $imagePath = null;
        if ($request->hasFile('foto_barang')) {
            $imagePath = $request->file('foto_barang')->store('products', 'public');
        }

        // 2. Simpan ke Database (Sesuaikan dengan Model Anda)
        $produk = produk::create([
            'user_id' => $request->user()->id,
            'nama_barang' => $request->nama_barang,
            'harga_barang' => $request->harga_barang,
            'stok_barang' => $request->stok_barang,
            'kategori' => $request->kategori,
            'deskripsi' => $request->deskripsi,
            'foto_barang' => $imagePath ? url('storage/' . $imagePath) : null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil diposting!',
            'data' => $produk
        ]);
    }

    // HAPUS BARANG (Soft Delete)
    public function destroy(Request $request, $id)
    {
        $produk = produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'produk tidak ditemukan'], 404);
        }

        // Cek Kepemilikan
        if ($request->user()->id !== $produk->seller_id) {
            return response()->json(['message' => 'Anda dilarang menghapus barang orang lain'], 403);
        }

        $produk->delete(); // Ini soft delete (data di DB masih ada, tapi hidden)

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil dihapus (disembunyikan)'
        ]);
    }
}