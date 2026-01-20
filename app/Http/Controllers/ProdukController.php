<?php

namespace App\Http\Controllers;

use App\Models\produk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProdukController extends Controller
{
    // 1. MENAMPILKAN SEMUA PRODUK (Public)
    public function index(Request $request)
    {
        $query = \App\Models\produk::query(); 

        // Filter Kategori
        if ($request->has('category')) {
            $query->where('kategori', $request->category);
        }
        // Search Nama
        if ($request->has('search')) {
            $query->where('nama_barang', 'like', '%' . $request->search . '%');
        }

        // Include Data User (Penjual)
        $products = $query->with('user')->latest()->get(); 

        return response()->json([
            'success' => true,
            'message' => 'Daftar Data Produk',
            'data'    => $products
        ]);
    }

    // 2. MENAMPILKAN DETAIL 1 PRODUK
    public function show($id)
    {
        // Tambah with user biar detail penjual muncul
        $produk = produk::with(['user', 'updater'])->find($id); 

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

    // 4. AMBIL PRODUK MILIK USER SENDIRI (Fitur My Products)
    public function userIndex(Request $request)
    {
        $user = $request->user();

        $products = \App\Models\produk::where('user_id', $user->id)
                    ->with('updater') // <--- PENTING: Agar nama pengedit muncul di frontend
                    ->latest()
                    ->get();

        return response()->json([
            'success' => true,
            'data'    => $products
        ]);
    }

    // 5. UPDATE PRODUK (Edit)
    public function update(Request $request, $id)
    {
        $produk = \App\Models\produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        // Cek Kepemilikan
        if ($request->user()->id !== $produk->user_id) {
            return response()->json(['message' => 'Anda dilarang mengedit barang orang lain'], 403);
        }

        // Validasi
        $request->validate([
            'nama_barang'  => 'required|string',
            'harga_barang' => 'required|integer',
            'stok_barang'  => 'required|integer',
            'kategori'     => 'required|string',
            'deskripsi'    => 'required|string',
            'foto_barang'  => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Cek apakah user upload foto baru?
        if ($request->hasFile('foto_barang')) {
            // Hapus foto lama
            if ($produk->foto_barang) {
                $oldPath = str_replace(url('storage/'), '', $produk->foto_barang);
                Storage::disk('public')->delete($oldPath);
            }
            // Upload foto baru
            $imagePath = $request->file('foto_barang')->store('products', 'public');
            $produk->foto_barang = url('storage/' . $imagePath);
        }

        // Update Data
        $produk->update([
            'nama_barang'  => $request->nama_barang,
            'harga_barang' => $request->harga_barang,
            'stok_barang'  => $request->stok_barang,
            'kategori'     => $request->kategori,
            'deskripsi'    => $request->deskripsi,
            
            // --- PENTING: Simpan siapa yang mengedit ---
            'updated_by'   => $request->user()->id 
            // ------------------------------------------
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui',
            'data'    => $produk
        ]);
    }

    // 6. HAPUS BARANG (Soft Delete)
    public function destroy(Request $request, $id)
    {
        $produk = \App\Models\produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        // Cek Kepemilikan
        if ($request->user()->id !== $produk->user_id) {
            return response()->json(['message' => 'Anda dilarang menghapus barang orang lain'], 403);
        }

        // Cek Status Pesanan Aktif
        $pesananAktif = \App\Models\DetailPesanan::where('produk_id', $produk->id)
            ->whereHas('pesanan', function($query) {
                $query->whereIn('status', ['pending', 'accepted', 'dikirim', 'selesai']);
            })
            ->exists();

        if ($pesananAktif) {
            return response()->json([
                'message' => 'Gagal: Produk sedang dalam proses transaksi (Pending/dikirim). Selesaikan dulu pesanan tersebut.'
            ], 400);
        }

        // Soft Delete
        $produk->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus'
        ]);
    }
}