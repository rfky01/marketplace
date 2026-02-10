<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{
    //---menampilkan daftar sesuai urutan---
    public function index()
    {
        // Urutkan berdasarkan kolom 'urutan' dari yang terkecil (ASC)
        $categories = Kategori::orderBy('urutan', 'asc')->get();
        return view('admin.categories', compact('categories'));
    }

    //---menambah kategori baru di urutan belakang---
    public function store(Request $request)
    {
        $request->validate([
            'nama_kategori' => 'required|string|max:255|unique:kategoris,nama_kategori'
        ]);

        //Cari urutan terakhir
        $maxUrutan = Kategori::max('urutan');

        Kategori::create([
            'nama_kategori' => $request->nama_kategori,
            'urutan' => $maxUrutan + 1 
        ]);

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan!');
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