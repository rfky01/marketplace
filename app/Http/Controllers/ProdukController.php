<?php

namespace App\Http\Controllers;

use App\Models\Produk; 
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProdukController extends Controller
{
    // 1. MENAMPILKAN SEMUA PRODUK (Public)
    public function index(Request $request)
    {
        $query = Produk::query(); 

        // Filter Kategori
        if ($request->has('category') && $request->category != '') {
            $query->where('kategori', $request->category);
        }
        // Search Nama
        if ($request->has('search') && $request->search != '') {
            $query->where('nama_barang', 'like', '%' . $request->search . '%');
        }

        $products = $query->with(['user', 'ulasan'])
                          ->latest()
                          ->paginate(12); 

        return response()->json([
            'success' => true,
            'message' => 'Daftar Data Produk',
            'data'    => $products
        ]);
    }

    // 2. MENAMPILKAN DETAIL 1 PRODUK
    public function show($id)
    {
        // Cek apakah $id berisi angka (ID asli) atau teks (Slug)        
        $query = Produk::with(['user', 'ulasan']);

        if (is_numeric($id)) {
            // Jika angka, cari berdasarkan ID
            $produk = $query->find($id);
        } else {
            // Jika teks, cari berdasarkan SLUG
            $produk = $query->where('slug', $id)->first();
        }

        if (!$produk) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $produk
        ]);
    }

    // 3. UPLOAD BARANG BARU (Khusus Penjual)
    public function store(Request $request)
    {
        // --- Definisi Validator yang Benar ---
        $validator = Validator::make($request->all(), [
            'nama_barang'  => 'required|string',
            'harga_barang' => 'required|numeric',
            'stok_barang'  => 'required|integer',
            'kategori'     => 'required|string',
            'deskripsi'    => 'required|string',
            'foto_barang'  => 'required', 
            'foto_barang.*'=> 'image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // --- LOGIKA UPLOAD MULTIPLE ---
        $fotoPaths = [];
        if ($request->hasFile('foto_barang')) {
            foreach($request->file('foto_barang') as $file) {
                $fotoPaths[] = $file->store('produk_images', 'public'); 
            }
        }

        $slugRaw = Str::slug($request->nama_barang);
        $slug = $slugRaw . '-' . Str::random(5);

        // Simpan ke Database (Laravel otomatis cast array ke JSON jika di model sudah di-cast)
        $produk = Produk::create([
            'user_id'      => $request->user()->id,
            'nama_barang'  => $request->nama_barang,
            'harga_barang' => $request->harga_barang,
            'stok_barang'  => $request->stok_barang,
            'kategori'     => $request->kategori,
            'deskripsi'    => $request->deskripsi,
            'foto_barang'  => $fotoPaths, 
            'slug'         => $slug,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil diposting!',
            'data'    => $produk
        ]);
    }

    // 4. AMBIL PRODUK MILIK USER SENDIRI
    public function userIndex(Request $request)
    {
        $user = $request->user();

        $products = Produk::where('user_id', $user->id)
                    ->with('updater') 
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
        $produk = Produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        if ($request->user()->id !== $produk->user_id) {
            return response()->json(['message' => 'Anda dilarang mengedit barang orang lain'], 403);
        }

        // --- Validasi Update ---
        $validator = Validator::make($request->all(), [
            'nama_barang'  => 'required|string',
            'harga_barang' => 'required|numeric',
            'stok_barang'  => 'required|integer',
            'kategori'     => 'required|string',
            'deskripsi'    => 'required|string',
            'foto_barang'  => 'nullable', 
            'foto_barang.*'=> 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Data yang akan diupdate
        $dataToUpdate = [
            'nama_barang'  => $request->nama_barang,
            'harga_barang' => $request->harga_barang,
            'stok_barang'  => $request->stok_barang,
            'kategori'     => $request->kategori,
            'deskripsi'    => $request->deskripsi,
            'updated_by'   => $request->user()->id 
        ];

        // --- Logic Update Foto Multiple ---
        if ($request->hasFile('foto_barang')) {
            // 1. Hapus foto lama
            if ($produk->foto_barang && is_array($produk->foto_barang)) {
                foreach($produk->foto_barang as $oldPhoto) {
                    if(Storage::disk('public')->exists($oldPhoto)) {
                        Storage::disk('public')->delete($oldPhoto);
                    }
                }
            }

            // 2. Upload foto baru
            $newFotoPaths = [];
            foreach($request->file('foto_barang') as $file) {
                $newFotoPaths[] = $file->store('produk_images', 'public');
            }
            
            // Masukkan ke array update
            $dataToUpdate['foto_barang'] = $newFotoPaths;
        }

        $produk->update($dataToUpdate);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui',
            'data'    => $produk
        ]);
    }

    // 6. HAPUS BARANG
    public function destroy(Request $request, $id)
    {
        $produk = Produk::find($id);

        if (!$produk) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        if ($request->user()->id !== $produk->user_id) {
            return response()->json(['message' => 'Anda dilarang menghapus barang orang lain'], 403);
        }

        // Cek Pesanan Aktif
        $pesananAktif = \App\Models\DetailPesanan::where('produk_id', $produk->id)
            ->whereHas('pesanan', function($query) {
                $query->whereIn('status', ['pending', 'accepted', 'dikirim']);
            })
            ->exists();

        if ($pesananAktif) {
            return response()->json([
                'message' => 'Gagal: Produk sedang dalam proses transaksi.'
            ], 400);
        }

        $produk->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus'
        ]);
    }
}