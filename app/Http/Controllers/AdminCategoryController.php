<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage; // Penting untuk hapus file gambar

class AdminCategoryController extends Controller
{
    // 1. TAMPILKAN HALAMAN UTAMA (VIEW)
    public function index()
    {
        // Ambil data urut dari yang terkecil (1, 2, 3...)
        $categories = Kategori::orderBy('urutan', 'asc')->get();

        // Kembalikan ke tampilan Blade, bukan JSON
        return view('admin.categories', compact('categories'));
    }

    // 2. SIMPAN KATEGORI BARU
    public function store(Request $request)
    {
        // Validasi
        $request->validate([
            'nama_kategori' => 'required|string|max:255',
            'icon'          => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Logic Upload Icon
        $iconPath = null;
        if ($request->hasFile('icon')) {
            $iconPath = $request->file('icon')->store('kategori_icons', 'public');
        }

        // Logic Urutan Otomatis (Taruh di paling belakang)
        $lastOrder = Kategori::max('urutan') ?? 0;

        // Simpan ke Database
        Kategori::create([
            'nama_kategori' => $request->nama_kategori,
            'icon'          => $iconPath,
            'urutan'        => $lastOrder + 1, // Urutan otomatis
            // 'slug'       => \Str::slug($request->nama_kategori) // Aktifkan jika pakai slug
        ]);

        // Redirect kembali ke halaman admin dengan pesan sukses
        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan!');
    }

    // 3. UPDATE KATEGORI (RENAME & GANTI ICON)
    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_kategori' => 'required|string|max:255',
            'icon'          => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $kategori = Kategori::findOrFail($id);
        
        $dataToUpdate = [
            'nama_kategori' => $request->nama_kategori
        ];

        // Cek jika user upload icon baru
        if ($request->hasFile('icon')) {
            // Hapus icon lama jika ada (biar server gak penuh)
            if ($kategori->icon && Storage::disk('public')->exists($kategori->icon)) {
                Storage::disk('public')->delete($kategori->icon);
            }
            // Upload icon baru
            $dataToUpdate['icon'] = $request->file('icon')->store('kategori_icons', 'public');
        }

        $kategori->update($dataToUpdate);

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui!');
    }

    // 4. HAPUS KATEGORI
    public function destroy($id)
    {
        $kategori = Kategori::findOrFail($id);

        // Hapus file icon dari penyimpanan server
        if ($kategori->icon && Storage::disk('public')->exists($kategori->icon)) {
            Storage::disk('public')->delete($kategori->icon);
        }

        $kategori->delete();

        return redirect()->back()->with('success', 'Kategori berhasil dihapus!');
    }

    // 5. ATUR ULANG POSISI (KHUSUS AJAX)
    // Ini tetap mengembalikan JSON karena dipanggil oleh JavaScript di background
    public function reorder(Request $request)
    {
        $request->validate(['ids' => 'required|array']);

        foreach ($request->ids as $index => $id) {
            // Update urutan berdasarkan posisi index array (mulai dari 1)
            Kategori::where('id', $id)->update(['urutan' => $index + 1]);
        }

        return response()->json(['status' => 'success', 'message' => 'Urutan diperbarui']);
    }
}