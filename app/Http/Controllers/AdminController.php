<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\GuestChat;

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
        ], [
            'password.confirmed' => 'Password konfirmasi tidak cocok!',
            'password.min' => 'Password minimal 8 karakter!',
            'email.unique' => 'Email ini sudah terdaftar sebagai admin/user lain.'
        ]);

            User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password), // Jangan lupa di-Hash
            'role' => 'admin', // <--- PAKSA JADI ADMIN DISINI
            'phone' => '-',    // Isi default jika wajib
            'address' => '-'   // Isi default jika wajib
        ]);

        return redirect()->back()->with('success', 'Admin baru berhasil ditambahkan!');
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
        $totalKategori = count(config('product_categories'));
        $totalPesanan = \Illuminate\Support\Facades\DB::table('pesanan')->count();

        return view('admin.dashboard', compact(
            'totalUsers', 'totalPenjual', 'totalPembeli', 
            'totalProduk', 'totalKategori', 'totalPesanan'
        ));
    }

    // 2. MANAGE USERS: Khusus Menampilkan Tabel Pengguna
    // 2. MANAGE USERS: Khusus Menampilkan Tabel Pengguna
    public function manageUsers(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\User::withCount('products')->latest();

        // 1. Cek request filter dari tombol (Penjual/Pembeli)
        if ($request->filter == 'penjual') {
            $query->has('products'); 
        } elseif ($request->filter == 'pembeli') {
            $query->doesntHave('products'); 
        }

        // 2. LOGIKA PENCARIAN (Berdasarkan Nama atau Email)
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        // AMBIL SEMUA DATA (Belum di-paginate)
        $usersData = $query->get();

        // 3. LOGIKA FILTER AKTIVITAS (Online / Offline dari Cache)
        if ($request->activity == 'online') {
            $usersData = $usersData->filter(function($user) {
                return $user->isOnline();
            })->values();
        } elseif ($request->activity == 'offline') {
            $usersData = $usersData->filter(function($user) {
                return !$user->isOnline();
            })->values();
        }

        // 4. PAGINATION MANUAL UNTUK COLLECTION CACHE
        $perPage = 10;
        $currentPage = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
        
        $currentItems = $usersData->slice(($currentPage - 1) * $perPage, $perPage)->values();
        
        $users = new \Illuminate\Pagination\LengthAwarePaginator(
            $currentItems, 
            $usersData->count(), 
            $perPage, 
            $currentPage, 
            [
                'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
                'query' => $request->query() // Bawa semua parameter url
            ]
        );
        
        $currentFilter = $request->filter ?? 'semua';

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

        if (!$userId) {
            $userId = request('id');
        }

        //OPSIONAL: Jika ingin hanya menampilkan user yang PERNAH chat saja (agar list tidak kepanjangan),
           //Gunakan kode ini dan hapus baris $users di atas:
           
           $chatIds = Chat::where('sender_id', $myId)
                    ->orWhere('receiver_id', $myId)
                    ->get()
                    ->map(function($chat) use ($myId) {
                        return $chat->sender_id == $myId ? $chat->receiver_id : $chat->sender_id;
                    })->unique();
           $users = User::whereIn('id', $chatIds)->get();
        

        // 2. Ambil Daftar Tamu (Guest) - BAGIAN INI SUDAH BENAR
        $guests = GuestChat::select('session_id', \DB::raw('MAX(created_at) as last_chat'))
            ->groupBy('session_id')
            ->orderBy('last_chat', 'desc')
            ->get();

        // 3. Logic Membuka Isi Pesan (Jika ada ID yang diklik)
        $messages = [];
        $activeChat = null;

        if ($userId) {
            // Cek apakah yang diklik adalah Member atau Tamu?
            // Kita cek berdasarkan request type dari URL (?type=guest atau ?type=member)
            $type = request('type');

            if ($type == 'guest') {
                // LOGIC BUKA CHAT TAMU
                // Kita buat object dummy untuk $activeChat agar tidak error di view
                $activeChat = (object) [
                    'id' => $userId, // Di sini $userId berisi session_id string
                    'name' => 'Tamu #' . substr($userId, -4),
                    'profile_photo' => null,
                    'email' => 'Guest Session'
                ];
                
                // Ambil pesan tamu
                $messages = GuestChat::where('session_id', $userId)
                    ->orderBy('created_at', 'asc')
                    ->get();

            } else {
                // LOGIC BUKA CHAT MEMBER (User Biasa)
                $activeChat = User::find($userId);
                
                if ($activeChat) {
                    $messages = Chat::where(function($q) use ($myId, $userId) {
                        $q->where('sender_id', $myId)->where('receiver_id', $userId);
                    })->orWhere(function($q) use ($myId, $userId) {
                        $q->where('sender_id', $userId)->where('receiver_id', $myId);
                    })->orderBy('created_at', 'asc')->get();
                }
            }
        }

        // --- UPDATE: Masukkan 'messages' dan 'activeChat' ke view ---
        return view('admin.chats', compact('users', 'guests', 'messages', 'activeChat'));
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

        foreach($user->products as $p) {
            if($p->ulasan) {
                foreach($p->ulasan as $u) {
                    $totalRatingToko += $u->rating;
                    $totalUlasanToko++;
                }
            }
            
            try {
                $terjual = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                    ->where('produk_id', $p->id)
                    ->sum('jumlah');
                $totalTerjual += $terjual;
            } catch (\Exception $e) { $totalTerjual += 0; }
        }

        $rataRataToko = $totalUlasanToko > 0 ? number_format($totalRatingToko / $totalUlasanToko, 1) : '0.0';
        $persentase = $totalUlasanToko > 0 ? round(($totalRatingToko / ($totalUlasanToko * 5)) * 100) : 0;

        $riwayatPesanan = [];
        try {
            $riwayatPesanan = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id') 
                ->join('produk', 'detail_pesanan.produk_id', '=', 'produk.id')
                ->where('produk.user_id', $id)
                ->groupBy('pesanan.id') 
                ->get();
        } catch (\Exception $e) { $riwayatPesanan = []; }

        // === PAGINATION MANUAL 12 PRODUK (BARU) ===
        $perPage = 12; 
        $currentPage = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
        $productsCollection = $user->products;
        
        $paginatedProducts = new \Illuminate\Pagination\LengthAwarePaginator(
            $productsCollection->slice(($currentPage - 1) * $perPage, $perPage)->values(), 
            $productsCollection->count(), 
            $perPage, 
            $currentPage, 
            [
                'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
                'query' => request()->query() 
            ]
        );

        // Tambahkan 'paginatedProducts' ke return view
        return view('admin.shop_detail', compact('user', 'rataRataToko', 'totalUlasanToko', 'persentase', 'totalTerjual', 'categories', 'riwayatPesanan', 'paginatedProducts'));
    }

    // Function untuk melihat detail produk (Sama persis tampilan user)
    public function showProduct($id)
    {
        // Ambil data produk beserta pemilik (user) dan ulasan
        $product = \App\Models\Produk::with(['user', 'ulasan.user'])->findOrFail($id);

        return view('admin.product_detail', compact('product'));
    }

    //---melihat riwayat pesanan spesifik di toko user---
    // GANTI BARIS INI: Tambahkan \Illuminate\Http\Request $request
    public function showShopOrders(\Illuminate\Http\Request $request, $id)
    {
        $user = \App\Models\User::findOrFail($id);

        // Hapus Try-Catch agar tidak memalsukan error menjadi Array kosong
        $query = \Illuminate\Support\Facades\DB::table('detail_pesanan')
            ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
            ->join('produk', 'detail_pesanan.produk_id', '=', 'produk.id')
            ->join('users', 'pesanan.user_id', '=', 'users.id')
            ->where('produk.user_id', $id);

        // 1. FILTER STATUS
        if ($request->filled('status')) {
            $query->where('pesanan.status', $request->status);
        }

        // 2. FILTER TANGGAL (BARU)
        if ($request->filled('tanggal')) {
            // whereDate digunakan karena format created_at di DB adalah 'YYYY-MM-DD HH:MM:SS'
            // Kita hanya ingin mencocokkan 'YYYY-MM-DD' nya saja
            $query->whereDate('pesanan.created_at', $request->tanggal);
        }

        // 3. FITUR PENCARIAN BARU (Produk & Pembeli)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('produk.nama_barang', 'like', '%' . $search . '%')
                  ->orWhere('users.name', 'like', '%' . $search . '%');
            });
        }

        // 3. EKSEKUSI & SIMPAN KE VARIABEL $riwayatPesanan MENGGUNAKAN PAGINATE
        $riwayatPesanan = $query->select(
                'pesanan.id as order_id',
                'pesanan.user_id as pembeli_id',
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
            ->paginate(15)->withQueryString(); 
            // Angka 15 berarti membatasi 15 data per halaman

        return view('admin.shop_orders', compact('user', 'riwayatPesanan'));
    }

    // --- Menampilkan Semua Produk (Untuk Admin) ---
    public function allProducts(\Illuminate\Http\Request $request)
    {
        // 1. GUNAKAN ELOQUENT MURNI: Memanggil data relasi 'user' dan 'ulasan'
        $query = \App\Models\Produk::with(['user', 'ulasan']);
        $categories = config('product_categories');
        $activeCategory = strtolower((string) $request->query('category', ''));

        if ($activeCategory && in_array($activeCategory, $categories, true)) {
            $query->whereRaw('LOWER(kategori) = ?', [$activeCategory]);
        }

        // 2. FITUR PENCARIAN
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                
                // A. Cari berdasarkan nama produk atau kategori (di tabel produk)
                $q->where('nama_barang', 'ilike', '%' . $search . '%')
                  ->orWhere('kategori', 'ilike', '%' . $search . '%')
                  
                  // B. Cari berdasarkan nama penjual (di tabel users) menggunakan "orWhereHas"
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        // 3. FITUR PENGURUTAN HARGA
        if ($request->filled('sort')) {
            if ($request->sort == 'lowest') {
                $query->orderBy('harga_barang', 'asc'); // Termurah
            } elseif ($request->sort == 'highest') {
                $query->orderBy('harga_barang', 'desc'); // Termahal
            } else {
                $query->latest(); // Default: Terbaru
            }
        } else {
            $query->latest(); // Default jika tidak ada filter
        }

        // 4. AMBIL DATA (PAGINATION)
        $products = $query->latest()
                          ->paginate(15)
                          ->withQueryString();

        return view('admin.admin_products', compact('products', 'categories', 'activeCategory'));
    }

    // --- Menampilkan Semua Transaksi (Untuk Admin) ---
    public function allTransactions(\Illuminate\Http\Request $request)
    {
        try {
            // 1. Ambil semua data mentah dari database
            $rawTransactions = \Illuminate\Support\Facades\DB::table('detail_pesanan')
                ->join('pesanan', 'detail_pesanan.pesanan_id', '=', 'pesanan.id')
                ->join('produk', 'detail_pesanan.produk_id', '=', 'produk.id')
                ->join('users as pembeli', 'pesanan.user_id', '=', 'pembeli.id')
                ->join('users as penjual', 'produk.user_id', '=', 'penjual.id')
                ->select(
                    'pesanan.id as order_id',
                    'pembeli.id as pembeli_id',
                    'pesanan.created_at as tanggal',
                    'pesanan.status',
                    'pembeli.name as nama_pembeli',
                    'penjual.name as nama_penjual',
                    'produk.nama_barang',
                    'produk.foto_barang',
                    'detail_pesanan.jumlah',
                    'detail_pesanan.total_harga'
                )
                ->orderBy('pesanan.created_at', 'desc')
                ->get();

            // 2. Rakit Nomor Invoice
            $rawTransactions->transform(function ($trx) {
                $trx->invoice_id = 'INV-' . \Carbon\Carbon::parse($trx->tanggal)->timestamp . '-' . $trx->pembeli_id;
                return $trx;
            });

            // Ambil jumlah total untuk ditampilkan di badge
            $totalSemua = $rawTransactions->count();

            // 3. Logika Filter Status (Dari Sidebar)
            $activeStatus = $request->status ?? 'semua';
            $filteredByStatus = $rawTransactions;

            if ($activeStatus !== 'semua') {
                $filteredByStatus = $rawTransactions->filter(function ($trx) use ($activeStatus) {
                    $status = strtolower(trim($trx->status));
                    if ($activeStatus === 'pending') return $status === 'pending';
                    if ($activeStatus === 'dikemas') return in_array($status, ['accepted', 'proses']);
                    if ($activeStatus === 'dikirim') return $status === 'dikirim';
                    if ($activeStatus === 'selesai') return $status === 'selesai';
                    if ($activeStatus === 'return') return str_contains($status, 'return');
                    if ($activeStatus === 'batal') return in_array($status, ['batal', 'dibatalkan', 'canceled', 'canceled by seller', 'canceled by buyer', 'ditolak']);
                    return true;
                })->values();
            }

            // 4. Logika Pencarian (PERBAIKAN VARIABEL DI SINI)
            if ($request->filled('search')) {
                $search = strtoupper(trim($request->search)); 
                $transactionsData = $filteredByStatus->filter(function ($trx) use ($search) {
                    return str_contains(strtoupper($trx->invoice_id), $search);
                })->values(); 
            } else {
                $transactionsData = $filteredByStatus;
            }

            // === 5. LOGIKA PAGINATION MANUAL ===
            $perPage = 10; // Menampilkan 10 transaksi per halaman
            $currentPage = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
            
            // Memotong data array sesuai halaman saat ini
            $currentItems = $transactionsData->slice(($currentPage - 1) * $perPage, $perPage)->values();
            
            // Membuat objek Paginator
            $transactions = new \Illuminate\Pagination\LengthAwarePaginator(
                $currentItems, 
                $transactionsData->count(), 
                $perPage, 
                $currentPage, 
                [
                    'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
                    'query' => $request->query() 
                ]
            );

        } catch (\Exception $e) {
            // PERBAIKAN DI SINI: Jangan gunakan collect([]), gunakan Paginator Kosong
            $transactions = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10, 1);
            $activeStatus = 'semua';
            $totalSemua = 0;
        }

        return view('admin.admin_transactions', compact('transactions', 'activeStatus', 'totalSemua'));
    }

    // --- FUNGSI AMBIL PESAN UNTUK POPUP CHAT ---
    // --- FUNGSI AMBIL PESAN UNTUK POPUP CHAT ---
    public function getPopupMessages($userId)
    {
        $myId = Auth::id();
        
        // 1. Ambil riwayat pesan
        $messages = Chat::where(function($q) use ($myId, $userId) {
            $q->where('sender_id', $myId)->where('receiver_id', $userId);
        })->orWhere(function($q) use ($myId, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $myId);
        })->orderBy('created_at', 'asc')->get();

        // 2. Ambil status Online / Offline User secara Real-time dari Cache
        $targetUser = User::find($userId);
        $isOnline = $targetUser ? $targetUser->isOnline() : false;
        $lastSeen = $targetUser ? $targetUser->getLastSeen() : 'Offline';

        // 3. Kirim semuanya ke Javascript
        return response()->json([
            'messages' => $messages,
            'isOnline' => $isOnline,
            'lastSeen' => $lastSeen
        ]);
    }

    // --- FUNGSI KIRIM PESAN UNTUK POPUP CHAT ---
    public function sendPopupMessage(Request $request, $userId)
    {
        $request->validate(['message' => 'required']);
        
        $chat = Chat::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $userId,
            'message' => $request->message
        ]);

        return response()->json(['success' => true, 'data' => $chat]);
    }
}
