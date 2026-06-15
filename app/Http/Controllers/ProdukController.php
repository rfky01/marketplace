<?php

namespace App\Http\Controllers;

use App\Models\Produk; 
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

class ProdukController extends Controller
{
    /**
     * @OA\Post(
     * path="/api/produk",
     * tags={"Produk"},
     * summary="Upload Produk Baru (Hanya Seller)",
     * security={{"bearerAuth":{}}}, 
     * @OA\RequestBody(
     * required=true,
     * @OA\MediaType(
     * mediaType="multipart/form-data",
     * @OA\Schema(
     * required={"nama_barang", "harga_barang", "stok_barang", "deskripsi", "foto_barang[]"},
     * @OA\Property(property="nama_barang", type="string", example="Laptop Asus"),
     * @OA\Property(property="harga_barang", type="integer", example=5000000),
     * @OA\Property(property="stok_barang", type="integer", example=10),
     * @OA\Property(property="deskripsi", type="string", example="Produk akan diklasifikasikan otomatis oleh Decision Tree"),
     * @OA\Property(
     * property="foto_barang[]",
     * type="array",
     * @OA\Items(type="string", format="binary")
     * )
     * )
     * )
     * ),
     * @OA\Response(response=201, description="Produk Berhasil Dibuat"),
     * @OA\Response(response=403, description="Forbidden (Bukan Seller)"),
     * @OA\Response(response=422, description="Error Validasi")
     * )
     */
    
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
        // Validasi input produk
        // Kategori tidak lagi divalidasi dari input frontend,
        // karena kategori akan dihasilkan otomatis oleh model Decision Tree.
        $validator = Validator::make($request->all(), [
            'nama_barang'   => 'required|string',
            'harga_barang'  => 'required|numeric',
            'stok_barang'   => 'required|integer',
            'deskripsi'     => 'required|string',
            'foto_barang'   => 'required',
            'foto_barang.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Mengirim nama produk dan deskripsi ke Python API Decision Tree
        try {
            $mlResponse = Http::timeout(15)->post(config('services.ml_api.url'), [
                'nama_produk' => $request->nama_barang,
                'deskripsi_produk' => $request->deskripsi,
            ]);

            if (!$mlResponse->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mendapatkan hasil klasifikasi dari Python API.',
                    'error' => $mlResponse->body()
                ], 500);
            }

            $kategoriPrediksi = $mlResponse->json('kategori');

            $kategoriValid = config('product_categories');

            if (!$kategoriPrediksi || !in_array($kategoriPrediksi, $kategoriValid)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kategori hasil prediksi tidak valid.',
                    'kategori_diterima' => $kategoriPrediksi
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Laravel gagal terhubung ke Python API Decision Tree.',
                'error' => $e->getMessage()
            ], 500);
        }

        // Upload foto produk
        $fotoPaths = [];
        if ($request->hasFile('foto_barang')) {
            foreach ($request->file('foto_barang') as $file) {
                $fotoPaths[] = $file->store('produk_images', 'public');
            }
        }

        // Membuat slug produk
        $slugRaw = Str::slug($request->nama_barang);
        $slug = $slugRaw . '-' . Str::random(5);

        // Simpan produk ke database dengan kategori hasil prediksi otomatis
        $produk = Produk::create([
            'user_id'       => $request->user()->id,
            'nama_barang'   => $request->nama_barang,
            'harga_barang'  => $request->harga_barang,
            'stok_barang'   => $request->stok_barang,
            'kategori'      => $kategoriPrediksi,
            'deskripsi'     => $request->deskripsi,
            'foto_barang'   => $fotoPaths,
            'slug'          => $slug,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil diposting dengan kategori otomatis!',
            'kategori_otomatis' => $kategoriPrediksi,
            'hasil_klasifikasi' => $mlResponse->json(),
            'data' => $produk
        ], 201);
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

        // Validasi update produk
        // Kategori tidak lagi divalidasi dari frontend,
        // karena kategori akan diprediksi otomatis oleh model Decision Tree.
        $validator = Validator::make($request->all(), [
            'nama_barang'   => 'required|string',
            'harga_barang'  => 'required|numeric',
            'stok_barang'   => 'required|integer',
            'deskripsi'     => 'required|string',
            'foto_barang'   => 'nullable',
            'foto_barang.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Prediksi ulang kategori menggunakan Python API Decision Tree
        try {
            $mlResponse = Http::timeout(15)->post(config('services.ml_api.url'), [
                'nama_produk' => $request->nama_barang,
                'deskripsi_produk' => $request->deskripsi,
            ]);

            if (!$mlResponse->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mendapatkan hasil klasifikasi dari Python API.',
                    'error' => $mlResponse->body()
                ], 500);
            }

            $kategoriPrediksi = $mlResponse->json('kategori');

            $kategoriValid = config('product_categories');

            if (!$kategoriPrediksi || !in_array($kategoriPrediksi, $kategoriValid)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kategori hasil prediksi tidak valid.',
                    'kategori_diterima' => $kategoriPrediksi
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Laravel gagal terhubung ke Python API Decision Tree.',
                'error' => $e->getMessage()
            ], 500);
        }

        // Data yang akan diupdate
        $dataToUpdate = [
            'nama_barang'  => $request->nama_barang,
            'harga_barang' => $request->harga_barang,
            'stok_barang'  => $request->stok_barang,
            'kategori'     => $kategoriPrediksi,
            'deskripsi'    => $request->deskripsi,
            'updated_by'   => $request->user()->id
        ];

        // Jika user upload foto baru, hapus foto lama lalu simpan foto baru
        if ($request->hasFile('foto_barang')) {
            if ($produk->foto_barang && is_array($produk->foto_barang)) {
                foreach ($produk->foto_barang as $oldPhoto) {
                    if (Storage::disk('public')->exists($oldPhoto)) {
                        Storage::disk('public')->delete($oldPhoto);
                    }
                }
            }

            $newFotoPaths = [];

            foreach ($request->file('foto_barang') as $file) {
                $newFotoPaths[] = $file->store('produk_images', 'public');
            }

            $dataToUpdate['foto_barang'] = $newFotoPaths;
        }

        $produk->update($dataToUpdate);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui dengan kategori otomatis.',
            'kategori_otomatis' => $kategoriPrediksi,
            'hasil_klasifikasi' => $mlResponse->json(),
            'data' => $produk
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
