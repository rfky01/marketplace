<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{
    public function index()
    {
        // UBAH: Urutkan berdasarkan kolom 'urutan' dari yang terkecil (ASC)
        $categories = Kategori::orderBy('urutan', 'asc')->get();
        return view('admin.categories', compact('categories'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kategori' => 'required|string|max:255|unique:kategoris,nama_kategori'
        ]);

        // Cari urutan terakhir
        $maxUrutan = Kategori::max('urutan');

        Kategori::create([
            'nama_kategori' => $request->nama_kategori,
            'urutan' => $maxUrutan + 1 // Set urutan di paling bawah
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan!');
    }

    public function update(Request $request, $id)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255']);
        Kategori::findOrFail($id)->update(['nama_kategori' => $request->nama_kategori]);
        return redirect()->back()->with('success', 'Kategori berhasil diperbarui!');
    }

    public function destroy($id)
    {
        Kategori::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Kategori berhasil dihapus!');
    }

    // --- FUNGSI BARU UNTUK UPDATE POSISI ---
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