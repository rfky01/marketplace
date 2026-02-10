<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{

/**
     * @OA\Get(
     * path="/api/kategori",
     * tags={"Admin - Kategori"},
     * summary="List Semua Kategori",
     * @OA\Response(response=200, description="Sukses")
     * )
     */
    //---menampilkan daftar sesuai urutan---
    public function index()
    {
        // Urutkan berdasarkan kolom 'urutan' dari yang terkecil (ASC)
        $categories = Kategori::orderBy('urutan', 'asc')->get();
        return response()->json([
            'success' => true,
            'message' => 'List Semua Kategori',
            'data'    => $categories
        ], 200);
    }

    /**
     * @OA\Post(
     * path="/api/kategori",
     * tags={"Admin - Kategori"},
     * summary="Buat Kategori Baru (Admin Only)",
     * security={{"bearerAuth":{}}},
     * @OA\RequestBody(
     * required=true,
     * @OA\MediaType(
     * mediaType="multipart/form-data",
     * @OA\Schema(
     * required={"nama_kategori"},
     * @OA\Property(property="nama_kategori", type="string", example="Fashion Pria"),
     * @OA\Property(property="icon", type="string", format="binary", description="Upload icon kategori")
     * )
     * )
     * ),
     * @OA\Response(response=201, description="Kategori dibuat"),
     * @OA\Response(response=403, description="Forbidden (Bukan Admin)")
     * )
     */
    //---menambah kategori baru di urutan belakang---
    public function store(Request $request)
    {
        // 1. Validasi Input
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'nama_kategori' => 'required|string|max:255',
            'icon'          => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // 2. Proses Upload Gambar (Jika ada)
        $path = null;
        if ($request->hasFile('icon')) {
            $path = $request->file('icon')->store('kategori_icons', 'public');
        }

        // 3. Simpan ke Database
        $kategori = \App\Models\Kategori::create([
            'nama_kategori' => $request->nama_kategori,
            'icon'          => $path,
            // 'slug'       => \Str::slug($request->nama_kategori) // Jika ada kolom slug
        ]);

        // 4. Return JSON (PENTING: Jangan redirect!)
        return response()->json([
            'success' => true,
            'message' => 'Kategori Berhasil Dibuat',
            'data'    => $kategori
        ], 201);
    }

    //---ganti nama kategori (Rename)---
    public function update(Request $request, $id)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255']);
        Kategori::findOrFail($id)->update(['nama_kategori' => $request->nama_kategori]);
        return redirect()->back()->with('success', 'Kategori berhasil diperbarui!');
    }

    //---menghapus nama kategori---
    public function destroy($id)
    {
        Kategori::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Kategori berhasil dihapus!');
    }

    // --- mengatur ulang posisi (fitur utama)---
    public function reorder(Request $request)
    {
        $request->validate(['ids' => 'required|array']);

        foreach ($request->ids as $index => $id) {
            // Update urutan berdasarkan posisi array (0, 1, 2...)
            Kategori::where('id', $id)->update(['urutan' => $index + 1]);
        }

        return response()->json(['status' => 'success']);
    }
}