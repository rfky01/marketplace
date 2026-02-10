<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    //---menambahkan admin baru (rekrut)---
    public function storeAdmin(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'admin',
            'email_verified_at' => now(), 
        ]);

        return redirect()->back()->with('success', 'Admin baru berhasil direkrut!');
    }

    // --- HALAMAN LIST ADMIN (absensi) ---
    public function manageAdmins()
    {
        // Ambil hanya user yang role-nya 'admin'
        $admins = \App\Models\User::where('role', 'admin')->latest()->get();
        
        return view('admin.admins', compact('admins'));
    }

    //---Halaman Dashboard Utama---
    public function dashboard()
    {
        // Hitung Total Pengguna
        $totalUsers = \App\Models\User::count();
        
        // Hitung Total Penjual (User yang punya minimal 1 produk)
        $totalPenjual = \App\Models\User::has('products')->count(); 
        
        // Hitung Total Pembeli (Sisanya)
        $totalPembeli = $totalUsers - $totalPenjual;

        $totalProduk = \App\Models\Produk::count();
        $totalKategori = \App\Models\Kategori::count();
        $totalPesanan = \Illuminate\Support\Facades\DB::table('pesanan')->count();

        return view('admin.dashboard', compact(
            'totalUsers', 'totalPenjual', 'totalPembeli', 
            'totalProduk', 'totalKategori', 'totalPesanan'
        ));
    }

    // 2. MANAGE USERS: Khusus Menampilkan Tabel Pengguna
    public function manageUsers()
    {
        $query = \App\Models\User::withCount('products')->latest();

        // Cek apakah ada request filter dari tombol
        if (request('filter') == 'penjual') {
            $query->has('products'); // Hanya yang punya produk
        } elseif (request('filter') == 'pembeli') {
            $query->doesntHave('products'); // Hanya yang TIDAK punya produk
        }

        $users = $query->get();
        
        $currentFilter = request('filter') ?? 'semua';

        return view('admin.users', compact('users', 'currentFilter'));
    }

    // 2. Fitur Hapus User
    public function destroyUser($id)
    {
        // 1. Cari User
        $user = \App\Models\User::findOrFail($id);

        // 2. Proteksi Admin Utama
        if ($user->email === 'admin@marketplace.com') {
            return back()->with('error', 'GAGAL: Akun Super Admin Utama dilindungi dan tidak bisa dihapus!');
        }

        // Daftar status yang dianggap "Aktif" (Belum selesai)
        $statusAktif = ['panding', 'dibayar', 'diproses', 'dikirim']; 
        
        // Cek apakah user punya pesanan dengan status di atas
        $pesananAktif = \Illuminate\Support\Facades\DB::table('pesanan')
            ->where('user_id', $user->id)
            ->whereIn('status', $statusAktif) 
            ->exists();

        if ($pesananAktif) {
            return back()->with('error', 'GAGAL: User ini sedang memiliki pesanan yang AKTIF (Pending/Dikirim). Selesaikan dulu transaksinya.');
        }

        // 4. Jika Tidak Ada Pesanan Aktif, Lanjutkan Penghapusan
        \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
            
            // Hapus semua Produk milik user (jika dia penjual)
            \App\Models\Produk::where('user_id', $user->id)->delete();

            // Hapus Riwayat Pesanan (yang statusnya sudah Selesai/Batal)
            \Illuminate\Support\Facades\DB::table('pesanan')->where('user_id', $user->id)->delete();

            // Hapus Foto Profil
            if ($user->profile_photo) {
                \Illuminate\Support\Facades\Storage::delete('public/' . $user->profile_photo);
            }

            // Akhirnya, Hapus User
            $user->delete();
        });

        return back()->with('success', 'Pengguna berhasil dihapus (Riwayat pesanan lama ikut terhapus).');
    }

    //---ambil semua chat dan saya adalah pengirim atau penerima---
    public function chats($userId = null)
    {
        $myId = Auth::id(); 

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

    //---FUNCTION REPLY---
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

    //---menampilkan halaman detail profil user---
    public function showUserProfile($id)
    {
        // Ambil data user beserta produknya (jika ada)
        $user = User::with('products')->findOrFail($id);

        return view('admin.user_profile', compact('user'));
    }

    //---menampilkan halaman Toko / Produk User---
    public function showShop($id)
    {
        // Ambil Kategori
        $categories = \App\Models\Produk::where('user_id', $id)->select('kategori')->distinct()->pluck('kategori');

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

        //menghitung rating
        foreach($user->products as $p) {
            if($p->ulasan) {
                foreach($p->ulasan as $u) {
                    $totalRatingToko += $u->rating;
                    $totalUlasanToko++;
                }
            }
            
            // Menggunakan tabel 'detail_pesanan'
            try {
                $terjual = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                    ->where('produk_id', $p->id)
                    ->sum('jumlah');
                $totalTerjual += $terjual;
            } catch (\Exception $e) { $totalTerjual += 0; }
        }

        $rataRataToko = $totalUlasanToko > 0 ? number_format($totalRatingToko / $totalUlasanToko, 1) : '0.0';
        $persentase = $totalUlasanToko > 0 ? round(($totalRatingToko / ($totalUlasanToko * 5)) * 100) : 0;

        // Mengambil data dari 'detail_pesanan' dan 'pesanan'
        $riwayatPesanan = [];
        try {
            $riwayatPesanan = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id') 
                ->join('produk', 'detail_pesanan.produk_id', '=', 'produk.id')
                ->where('produk.user_id', $id)
                ->groupBy('pesanan.id') 
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

    //---melihat riwayat pesanan spesifik di toko user---
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
                ->where('produk.user_id', $id);

            // 2. FILTER STATUS (Cek jika user memilih status)
            if (request()->filled('status')) {
                $query->where('pesanan.status', request('status'));
            }

            // 3. EKSEKUSI & SIMPAN KE VARIABEL $riwayatPesanan
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
                ->get();

        } catch (\Exception $e) {
            $riwayatPesanan = [];
        }

        return view('admin.shop_orders', compact('user', 'riwayatPesanan'));
    }
}