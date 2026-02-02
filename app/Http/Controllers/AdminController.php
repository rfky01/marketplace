<?php

namespace App\Http\Controllers; // <--- INI WAJIB ADA DAN HARUS PERSIS

use App\Models\Chat;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Auth;

class AdminController extends Controller // <--- INI JUGA WAJIB
{
    // 1. Halaman Dashboard Utama
    public function dashboard(Request $request)
    {
        // 1. Siapkan Query Dasar (Semua user kecuali admin)
        $query = User::where('role', '!=', 'admin')
                     ->withCount('products') // Hitung jumlah produk
                     ->with('products');     // Ambil data produk

        // 2. Cek apakah ada Filter yang diklik?
        if ($request->filter == 'penjual') {
            // Tampilkan HANYA yang punya produk (has products)
            $query->has('products'); 
        } elseif ($request->filter == 'pembeli') {
            // Tampilkan HANYA yang TIDAK punya produk (doesntHave products)
            $query->doesntHave('products');
        }

        // 3. Eksekusi Query
        $users = $query->latest()->paginate(10);

        // Simpan status filter saat ini agar tombolnya bisa "menyala"
        $currentFilter = $request->filter ?? 'all';

        return view('admin.dashboard', compact('users', 'currentFilter'));
    }

    // 2. Fitur Hapus User
    public function destroyUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return back()->with('success', 'User berhasil dihapus.');
    }
    
    // 4. Manage Users (Redirect ke dashboard saja)
    public function manageUsers()
    {
        return $this->dashboard();
    }

    public function chats($userId = null)
    {
        $myId = Auth::id(); // ID Admin

        // 1. Ambil daftar user yang pernah chat dengan Admin
        $chatIds = Chat::where('sender_id', $myId)
                    ->orWhere('receiver_id', $myId)
                    ->get()
                    ->map(function($chat) use ($myId) {
                        return $chat->sender_id == $myId ? $chat->receiver_id : $chat->sender_id;
                    })
                    ->unique();

        $users = User::whereIn('id', $chatIds)->get();

        // 2. Jika Admin klik salah satu user, ambil isi pesannya
        $messages = [];
        $activeChat = null;

        if ($userId) {
            $activeChat = User::findOrFail($userId);
            
            $messages = Chat::where(function($q) use ($myId, $userId) {
                $q->where('sender_id', $myId)->where('receiver_id', $userId);
            })->orWhere(function($q) use ($myId, $userId) {
                $q->where('sender_id', $userId)->where('receiver_id', $myId);
            })->orderBy('created_at', 'asc')->get();
        }

        return view('admin.chats', compact('users', 'messages', 'activeChat'));
    }

    // TAMBAHKAN FUNCTION REPLY INI:
    public function sendReply(Request $request, $userId)
    {
        $request->validate(['message' => 'required']);

        Chat::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $userId,
            'message' => $request->message
        ]);

        return back();
    }

    // Function untuk menampilkan halaman detail profil
    public function showUserProfile($id)
    {
        // Ambil data user beserta produknya (jika ada)
        $user = User::with('products')->findOrFail($id);

        return view('admin.user_profile', compact('user'));
    }

    // Function untuk menampilkan halaman Toko / Produk User
    public function showShop($id)
    {
        // Ambil Kategori
        $categories = \App\Models\Produk::where('user_id', $id)->select('kategori')->distinct()->pluck('kategori');

        // Query Utama Produk
        $user = \App\Models\User::with(['products' => function($query) {
            $query->with('ulasan'); 
            if (request('search')) $query->where('nama_barang', 'like', '%' . request('search') . '%');
            if (request('category')) $query->where('kategori', request('category'));
            if (request('sort') == 'lowest') $query->orderBy('harga_barang', 'asc');
            elseif (request('sort') == 'highest') $query->orderBy('harga_barang', 'desc');
            else $query->latest();
        }])->findOrFail($id);

        // Hitung Statistik
        $totalRatingToko = 0;
        $totalUlasanToko = 0;
        $totalTerjual = 0;

        foreach($user->products as $p) {
            if($p->ulasan) {
                foreach($p->ulasan as $u) {
                    $totalRatingToko += $u->rating;
                    $totalUlasanToko++;
                }
            }
            
            // PERBAIKAN: Menggunakan tabel 'detail_pesanan'
            try {
                $terjual = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                    ->where('produk_id', $p->id)
                    ->sum('jumlah');
                $totalTerjual += $terjual;
            } catch (\Exception $e) { $totalTerjual += 0; }
        }

        $rataRataToko = $totalUlasanToko > 0 ? number_format($totalRatingToko / $totalUlasanToko, 1) : '0.0';
        $persentase = $totalUlasanToko > 0 ? round(($totalRatingToko / ($totalUlasanToko * 5)) * 100) : 0;

        // PERBAIKAN: Mengambil data dari 'detail_pesanan' dan 'pesanan'
        $riwayatPesanan = [];
        try {
            $riwayatPesanan = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id') // Join ke tabel pesanan
                ->join('produk', 'detail_pesanan.produk_id', '=', 'produk.id')
                ->where('produk.user_id', $id)
                ->groupBy('pesanan.id') // Hitung per Transaksi ID
                ->get();
        } catch (\Exception $e) { $riwayatPesanan = []; }

        return view('admin.shop_detail', compact('user', 'rataRataToko', 'totalUlasanToko', 'persentase', 'totalTerjual', 'categories', 'riwayatPesanan'));
    }

    // Function untuk melihat detail produk (Sama persis tampilan user)
    public function showProduct($id)
    {
        // Ambil data produk beserta pemilik (user) dan ulasan
        $product = \App\Models\Produk::with(['user', 'ulasan.user'])->findOrFail($id);

        return view('admin.product_detail', compact('product'));
    }

    public function showShopOrders($id)
    {
        $user = \App\Models\User::findOrFail($id);

        $riwayatPesanan = [];
        try {
            // 1. QUERY DASAR (Simpan ke variabel $query dulu)
            $query = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
                ->join('produk', 'detail_pesanan.produk_id', '=', 'produk.id')
                ->join('users', 'pesanan.user_id', '=', 'users.id')
                ->where('produk.user_id', $id); // <--- Pastikan ada titik koma (;)

            // 2. FILTER STATUS (Cek jika user memilih status)
            if (request()->filled('status')) {
                $query->where('pesanan.status', request('status'));
            }

            // 3. EKSEKUSI & SIMPAN KE VARIABEL $riwayatPesanan (PENTING!)
            $riwayatPesanan = $query->select(
                    'pesanan.id as order_id',
                    'pesanan.created_at as tanggal',
                    'pesanan.status',
                    'users.name as pembeli',
                    'users.profile_photo as foto_pembeli',
                    'produk.nama_barang',
                    'produk.foto_barang',
                    'detail_pesanan.jumlah',
                    'detail_pesanan.total_harga'
                )
                ->orderBy('pesanan.created_at', 'desc')
                ->get(); // <--- Ambil datanya di sini

        } catch (\Exception $e) {
            $riwayatPesanan = [];
        }

        return view('admin.shop_orders', compact('user', 'riwayatPesanan'));
    }
}