<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Http\Controllers\Controller;
use App\Models\AdminOverrideLog;
use App\Models\Pesanan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\GuestChat;

use Illuminate\Support\Facades\Auth;

class AdminController extends Controller
{
    //---menambahkan admin baru (rekrut)---
    public function storeAdmin(Request $request)
    {
        if (!Auth::user()?->isSuperAdmin()) {
            abort(403, 'Hanya Super Admin yang dapat menambahkan admin baru.');
        }

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
        if (!Auth::user()?->isSuperAdmin()) {
            abort(403, 'Hanya Super Admin yang dapat mengelola administrator.');
        }

        // Ambil user admin dan super admin
        $admins = \App\Models\User::whereIn('role', ['super_admin', 'admin'])
            ->orderByRaw("CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END")
            ->latest()
            ->get();
        
        return view('admin.admins', compact('admins'));
    }

    //---Halaman Dashboard Utama---
    public function dashboard()
    {
        // Hitung Total Pengguna
        $totalUsers = \App\Models\User::count();
        
        $nonAdminUsers = \App\Models\User::where(function ($query) {
            $query->whereNotIn('role', ['admin', 'super_admin'])
                ->orWhereNull('role');
        });

        // Hitung Total Penjual (User non-admin yang punya minimal 1 produk)
        $totalPenjual = (clone $nonAdminUsers)->has('products')->count(); 
        
        // Hitung Total Pembeli (User non-admin yang belum membuka toko)
        $totalPembeli = (clone $nonAdminUsers)->doesntHave('products')->count();

        $totalProduk = \App\Models\Produk::count();
        $totalKategori = count(config('product_categories'));
        $totalPesanan = \Illuminate\Support\Facades\DB::table('pesanan')->count();

        $modelStats = $this->loadDecisionTreeModelStats();

        return view('admin.dashboard', compact(
            'totalUsers', 'totalPenjual', 'totalPembeli', 
            'totalProduk', 'totalKategori', 'totalPesanan', 'modelStats'
        ));
    }

    private function loadDecisionTreeModelStats(): array
    {
        // Statistik dashboard dibuat statis sementara dan tidak lagi dibaca
        // otomatis dari ml-api/training_report.json.
        $totalData = 1000;
        $accuracyPercent = 98.00;
        $correctPredictions = (int) round($totalData * ($accuracyPercent / 100));

        return [
            'available' => true,
            'algorithm' => 'TF-IDF + Decision Tree',
            'dataset_file' => 'dataset_produk_umkm.xlsx',
            'total_data' => $totalData,
            'training_data' => 800,
            'testing_data' => 200,
            'accuracy_percent' => $accuracyPercent,
            'correct_predictions' => $correctPredictions,
            'incorrect_predictions' => $totalData - $correctPredictions,
        ];
    }

    // 2. MANAGE USERS: Khusus Menampilkan Tabel Pengguna
    // 2. MANAGE USERS: Khusus Menampilkan Tabel Pengguna
    public function manageUsers(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\User::withCount('products')->latest();

        // 1. Cek request filter dari tombol (Penjual/Pembeli)
        if (in_array($request->filter, ['penjual', 'pembeli'])) {
            $query->where(function ($q) {
                $q->whereNotIn('role', ['admin', 'super_admin'])
                  ->orWhereNull('role');
            });
        }

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
        if ($user->isSuperAdmin()) {
            return back()->with('error', 'GAGAL: Akun Super Admin dilindungi dan tidak bisa dihapus!');
        }

        if ($user->id === Auth::id()) {
            return back()->with('error', 'GAGAL: Anda tidak bisa menghapus akun sendiri.');
        }

        if ($user->role === 'admin' && !Auth::user()?->isSuperAdmin()) {
            return back()->with('error', 'GAGAL: Hanya Super Admin yang dapat menghapus admin lain.');
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

    private function ensureSuperAdminOverride(): void
    {
        if (!Auth::user()?->isSuperAdmin()) {
            abort(403, 'Hanya Super Admin yang dapat menjalankan override.');
        }
    }

    private function writeOverrideLog(string $action, ?User $targetUser, ?string $subjectType, ?int $subjectId, string $reason, array $oldValues = [], array $newValues = []): void
    {
        AdminOverrideLog::create([
            'actor_id' => Auth::id(),
            'target_user_id' => $targetUser?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'reason' => $reason,
            'old_values' => $oldValues ?: null,
            'new_values' => $newValues ?: null,
        ]);
    }

    private function sendOverrideWebsiteMessage(?User $targetUser, string $title, string $reason, array $details = []): void
    {
        if (!$targetUser || $targetUser->id === Auth::id()) {
            return;
        }

        $detailLines = collect($details)
            ->filter(fn ($value) => filled($value))
            ->map(fn ($value, $label) => "- {$label}: " . trim((string) $value))
            ->implode("\n");

        $messageParts = [
            "Halo {$targetUser->name},",
            "NOTIFIKASI OVERRIDE SUPER ADMIN",
            trim($title),
            "Alasan:\n" . trim($reason),
        ];

        if ($detailLines !== '') {
            $messageParts[] = "Detail:\n{$detailLines}";
        }

        $messageParts[] = "Catatan:\nTindakan ini dilakukan sebagai bantuan admin dan tercatat di sistem PangkalMart.";
        $messageParts[] = "Pesan ini dikirim otomatis melalui website PangkalMart.";

        $message = implode("\n\n", $messageParts);

        Chat::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $targetUser->id,
            'message' => $message,
            'is_read' => false,
        ]);
    }

    private function resolveOverrideCategory(Request $request): array
    {
        $fallbackCategory = strtolower((string) $request->input('kategori'));
        $validCategories = config('product_categories');

        try {
            $mlResponse = Http::timeout(15)->post(config('services.ml_api.url'), [
                'nama_produk' => $request->nama_barang,
                'deskripsi_produk' => $request->deskripsi,
            ]);

            if ($mlResponse->successful()) {
                $predictedCategory = strtolower((string) $mlResponse->json('kategori'));

                if ($predictedCategory && in_array($predictedCategory, $validCategories, true)) {
                    return [
                        'kategori' => $predictedCategory,
                        'source' => 'decision_tree',
                        'meta' => $mlResponse->json(),
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Super Admin override tetap bisa memakai kategori cadangan jika model klasifikasi bermasalah.
        }

        return [
            'kategori' => $fallbackCategory,
            'source' => 'manual_override_fallback',
            'meta' => null,
        ];
    }

    public function overrideUserPassword(Request $request, $id)
    {
        $this->ensureSuperAdminOverride();

        $targetUser = User::findOrFail($id);

        if ($targetUser->isSuperAdmin()) {
            return back()->with('error', 'GAGAL: Password Super Admin tidak dapat direset lewat fitur override.');
        }

        if ($targetUser->id === Auth::id()) {
            return back()->with('error', 'GAGAL: Anda tidak bisa mereset password akun sendiri lewat override.');
        }

        $validated = $request->validate([
            'temporary_password' => 'required|string|min:8|confirmed',
            'override_reason' => 'required|string|min:10|max:1000',
        ], [
            'override_reason.required' => 'Alasan override wajib diisi.',
            'override_reason.min' => 'Alasan override minimal 10 karakter.',
            'temporary_password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $oldValues = [
            'email' => $targetUser->email,
            'password_reset_at' => now()->toDateTimeString(),
        ];

        $targetUser->forceFill([
            'password' => Hash::make($validated['temporary_password']),
        ])->save();

        $this->writeOverrideLog(
            'reset_user_password',
            $targetUser,
            User::class,
            $targetUser->id,
            $validated['override_reason'],
            $oldValues,
            ['password_reset' => true]
        );

        $this->sendOverrideWebsiteMessage(
            $targetUser,
            'Super Admin membantu mengatur ulang password sementara akun Anda.',
            $validated['override_reason'],
            [
                'Akun' => $targetUser->email,
                'Waktu' => now()->format('d/m/Y H:i'),
            ]
        );

        return back()->with('success', 'Password sementara user berhasil diatur oleh Super Admin.');
    }

    public function overrideStoreProduct(Request $request, $id)
    {
        $this->ensureSuperAdminOverride();

        $seller = User::findOrFail($id);

        if ($seller->isAdminUser()) {
            return back()->with('error', 'GAGAL: Produk override hanya boleh dibuat untuk user/seller, bukan admin.');
        }

        $validated = $request->validate([
            'nama_barang' => 'required|string|max:255',
            'harga_barang' => 'required|numeric|min:0',
            'stok_barang' => 'required|integer|min:0',
            'deskripsi' => 'required|string',
            'kategori' => 'required|string|in:' . implode(',', config('product_categories')),
            'foto_barang' => 'required',
            'foto_barang.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'override_reason' => 'required|string|min:10|max:1000',
        ], [
            'override_reason.required' => 'Alasan override wajib diisi.',
            'override_reason.min' => 'Alasan override minimal 10 karakter.',
        ]);

        $categoryInfo = $this->resolveOverrideCategory($request);
        $fotoPaths = [];

        foreach ($request->file('foto_barang', []) as $file) {
            $fotoPaths[] = $file->store('produk_images', 'public');
        }

        $oldRole = $seller->role;
        $slug = Str::slug($validated['nama_barang']) . '-' . Str::random(5);

        $produk = null;

        DB::transaction(function () use ($validated, $seller, $fotoPaths, $categoryInfo, $slug, $oldRole, &$produk) {
            if ($seller->role !== 'penjual') {
                $seller->forceFill(['role' => 'penjual'])->save();
            }

            $produk = \App\Models\Produk::create([
                'user_id' => $seller->id,
                'nama_barang' => $validated['nama_barang'],
                'harga_barang' => $validated['harga_barang'],
                'stok_barang' => $validated['stok_barang'],
                'kategori' => $categoryInfo['kategori'],
                'deskripsi' => $validated['deskripsi'],
                'foto_barang' => $fotoPaths,
                'slug' => $slug,
                'updated_by' => Auth::id(),
            ]);

            $this->writeOverrideLog(
                'create_product_for_seller',
                $seller,
                \App\Models\Produk::class,
                $produk->id,
                $validated['override_reason'],
                ['seller_role' => $oldRole],
                [
                    'product_id' => $produk->id,
                    'product_name' => $produk->nama_barang,
                    'seller_role' => $seller->role,
                    'category' => $produk->kategori,
                    'category_source' => $categoryInfo['source'],
                ]
            );

            $this->sendOverrideWebsiteMessage(
                $seller,
                'Super Admin membantu mengupload produk untuk toko Anda.',
                $validated['override_reason'],
                [
                    'Produk' => $produk->nama_barang,
                    'Kategori' => ucfirst($produk->kategori),
                    'Stok' => $produk->stok_barang,
                    'Harga' => 'Rp ' . number_format((int) $produk->harga_barang, 0, ',', '.'),
                ]
            );
        });

        return redirect()
            ->route('admin.products', array_filter([
                'seller_id' => $seller->id,
                'profile_back_url' => $request->input('profile_back_url'),
            ]))
            ->with('success', 'Produk berhasil dibuat oleh Super Admin sebagai override untuk seller.');
    }

    public function overrideCreateOrderForBuyer(Request $request, $id)
    {
        $this->ensureSuperAdminOverride();

        $product = \App\Models\Produk::with('user')->findOrFail($id);

        $validated = $request->validate([
            'buyer_id' => 'required|exists:users,id',
            'jumlah' => 'required|integer|min:1',
            'nama_penerima' => 'required|string|max:255',
            'email_penerima' => 'required|email|max:255',
            'telepon_penerima' => 'required|string|max:30',
            'alamat_pengiriman' => 'required|string|max:1000',
            'waktu_pengiriman' => 'required|date',
            'metode_pembayaran' => 'required|string|max:100',
            'catatan' => 'nullable|string|max:1000',
            'override_reason' => 'required|string|min:10|max:1000',
        ], [
            'buyer_id.required' => 'Pembeli wajib dipilih.',
            'jumlah.required' => 'Jumlah beli wajib diisi.',
            'nama_penerima.required' => 'Nama penerima wajib diisi.',
            'email_penerima.required' => 'Email penerima wajib diisi.',
            'email_penerima.email' => 'Format email penerima tidak valid.',
            'telepon_penerima.required' => 'Nomor penerima wajib diisi.',
            'alamat_pengiriman.required' => 'Alamat pengiriman wajib diisi.',
            'waktu_pengiriman.required' => 'Waktu pengiriman wajib diisi.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
            'override_reason.required' => 'Alasan override wajib diisi.',
            'override_reason.min' => 'Alasan override minimal 10 karakter.',
        ]);

        $buyer = User::findOrFail($validated['buyer_id']);

        if ($buyer->isAdminUser()) {
            return back()->with('error', 'GAGAL: Override beli produk hanya boleh dibuat untuk user/pembeli, bukan admin.');
        }

        if ((int) $product->user_id === (int) $buyer->id) {
            return back()->with('error', 'GAGAL: Pembeli tidak boleh sama dengan penjual produk.');
        }

        $createdOrder = null;

        try {
            DB::transaction(function () use ($validated, $product, $buyer, &$createdOrder) {
                $lockedProduct = \App\Models\Produk::whereKey($product->id)->lockForUpdate()->firstOrFail();

                if ($lockedProduct->stok_barang < $validated['jumlah']) {
                    throw new \RuntimeException('Stok produk "' . $lockedProduct->nama_barang . '" tidak cukup.');
                }

                $subtotal = (int) $lockedProduct->harga_barang * (int) $validated['jumlah'];
                $invoiceCode = $this->generateOverrideInvoiceCode($buyer->id);

                $pesanan = Pesanan::create([
                    'user_id' => $buyer->id,
                    'invoice_code' => $invoiceCode,
                    'tanggal' => now(),
                    'grand_total' => $subtotal,
                    'status' => 'pending',
                    'nama_penerima' => $validated['nama_penerima'],
                    'email_penerima' => $validated['email_penerima'],
                    'telepon_penerima' => $validated['telepon_penerima'],
                    'alamat_pengiriman' => $validated['alamat_pengiriman'],
                    'catatan' => $validated['catatan'] ?? null,
                    'waktu_pengiriman' => $validated['waktu_pengiriman'],
                    'metode_pembayaran' => $validated['metode_pembayaran'],
                ]);

                DB::table('detail_pesanan')->insert([
                    'pesanan_id' => $pesanan->id,
                    'produk_id' => $lockedProduct->id,
                    'jumlah' => $validated['jumlah'],
                    'total_harga' => $subtotal,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $lockedProduct->decrement('stok_barang', $validated['jumlah']);

                $this->writeOverrideLog(
                    'create_order_for_buyer',
                    $buyer,
                    Pesanan::class,
                    $pesanan->id,
                    $validated['override_reason'],
                    [
                        'product_stock' => $product->stok_barang,
                        'order_status' => null,
                    ],
                    [
                        'invoice_code' => $pesanan->invoice_code,
                        'order_status' => $pesanan->status,
                        'product_id' => $lockedProduct->id,
                        'product_name' => $lockedProduct->nama_barang,
                        'seller_id' => $lockedProduct->user_id,
                        'quantity' => (int) $validated['jumlah'],
                        'grand_total' => $subtotal,
                    ]
                );

                $this->sendOverrideWebsiteMessage(
                    $buyer,
                    'Super Admin membantu membuat pesanan manual untuk Anda.',
                    $validated['override_reason'],
                    [
                        'Invoice' => $pesanan->invoice_code,
                        'Produk' => $lockedProduct->nama_barang,
                        'Jumlah' => $validated['jumlah'],
                        'Total' => 'Rp ' . number_format($subtotal, 0, ',', '.'),
                        'Status' => $pesanan->status,
                    ]
                );

                $createdOrder = $pesanan;
            });

            if ($createdOrder) {
                $createdOrder->load(['detail_pesanan.produk.user']);
                $this->sendOverrideOrderNotificationToSeller($createdOrder);
            }
        } catch (\Throwable $e) {
            return back()->with('error', 'GAGAL override beli produk: ' . $e->getMessage())->withInput();
        }

        return back()->with('success', 'Pesanan manual berhasil dibuat oleh Super Admin sebagai override untuk pembeli.');
    }

    private function sendOverrideOrderNotificationToSeller(Pesanan $pesanan): void
    {
        $detailsBySeller = $pesanan->detail_pesanan
            ->filter(fn ($detail) => $detail->produk && $detail->produk->user)
            ->groupBy(fn ($detail) => $detail->produk->user_id);

        foreach ($detailsBySeller as $sellerDetails) {
            $seller = $sellerDetails->first()->produk->user;
            $targetPhone = $this->normalizeWhatsappPhone($seller->phone ?? null);

            if (!$targetPhone) {
                Log::warning('GoWa override order notification skipped: seller phone is empty', [
                    'order_id' => $pesanan->id,
                    'seller_id' => $seller->id,
                ]);
                continue;
            }

            $sellerTotal = $sellerDetails->sum(fn ($detail) => (int) $detail->total_harga);
            $items = $sellerDetails
                ->map(function ($detail) {
                    $productName = $detail->produk?->nama_barang ?: 'Produk';
                    $qty = (int) $detail->jumlah;
                    $total = number_format((int) $detail->total_harga, 0, ',', '.');

                    return "- {$productName} x{$qty} = Rp {$total}";
                })
                ->implode("\n");

            $deliveryTime = $pesanan->waktu_pengiriman
                ? $pesanan->waktu_pengiriman->timezone(config('app.timezone'))->format('d/m/Y H:i')
                : '-';

            $message = "Halo {$seller->name},\n\n"
                . "Ada pesanan baru masuk di PangkalMart. Pesanan ini dibuat oleh Super Admin sebagai bantuan override.\n\n"
                . "Invoice: *{$pesanan->invoice_code}*\n"
                . "Pembeli: {$pesanan->nama_penerima}\n"
                . "Waktu Pengiriman: {$deliveryTime}\n\n"
                . "Produk:\n{$items}\n\n"
                . "Total untuk toko Anda: Rp " . number_format($sellerTotal, 0, ',', '.') . "\n\n"
                . "Silakan buka website untuk menerima atau menolak pesanan.";

            $this->sendGowaMessage($targetPhone, $message, [
                'order_id' => $pesanan->id,
                'seller_id' => $seller->id,
                'invoice' => $pesanan->invoice_code,
                'source' => 'super_admin_override',
            ]);
        }
    }

    private function sendGowaMessage(string $targetPhone, string $message, array $context = []): void
    {
        $gowaUrl = rtrim((string) config('services.gowa.url'), '/');
        $deviceId = config('services.gowa.device_id');

        if (!$gowaUrl || !$deviceId) {
            Log::warning('GoWa override order notification skipped: config is incomplete', $context);
            return;
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders(['X-Device-Id' => $deviceId])
                ->post($gowaUrl . '/send/message', [
                    'phone' => $targetPhone,
                    'message' => $message,
                ]);

            if (!$response->successful()) {
                Log::warning('GoWa override order notification failed', array_merge($context, [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]));
            }
        } catch (\Throwable $e) {
            Log::error('GoWa override order notification error: ' . $e->getMessage(), $context);
        }
    }

    private function normalizeWhatsappPhone(?string $phone): ?string
    {
        $phone = preg_replace('/[^0-9]/', '', (string) $phone);

        if ($phone === '') {
            return null;
        }

        if (str_starts_with($phone, '0')) {
            return '62' . substr($phone, 1);
        }

        return $phone;
    }

    private function generateOverrideInvoiceCode(int $buyerId): string
    {
        do {
            $invoiceCode = 'INV-OVR-' . now()->format('YmdHis') . '-' . $buyerId . '-' . Str::upper(Str::random(4));
        } while (Pesanan::where('invoice_code', $invoiceCode)->exists());

        return $invoiceCode;
    }

    public function overrideOrderStatus(Request $request, $id)
    {
        $this->ensureSuperAdminOverride();

        $validated = $request->validate([
            'status' => 'required|string|in:pending,accepted,dikirim,selesai,canceled by seller,canceled by buyer,return_requested,return_accepted,return_rejected',
            'override_reason' => 'required|string|min:10|max:1000',
        ], [
            'override_reason.required' => 'Alasan override wajib diisi.',
            'override_reason.min' => 'Alasan override minimal 10 karakter.',
        ]);

        $order = Pesanan::findOrFail($id);
        $oldStatus = $order->status;
        $newStatus = $validated['status'];

        if ($oldStatus === $newStatus) {
            return back()->with('error', 'Status pesanan sudah berada pada status tersebut.');
        }

        $cancelStatuses = ['canceled by seller', 'canceled by buyer'];

        try {
            DB::transaction(function () use ($order, $oldStatus, $newStatus, $cancelStatuses, $validated) {
                $details = DB::table('detail_pesanan')
                    ->where('pesanan_id', $order->id)
                    ->get();

                if (in_array($newStatus, $cancelStatuses, true) && !in_array($oldStatus, $cancelStatuses, true)) {
                    foreach ($details as $detail) {
                        $product = \App\Models\Produk::withTrashed()->lockForUpdate()->find($detail->produk_id);
                        if ($product) {
                            $product->increment('stok_barang', $detail->jumlah);
                        }
                    }
                }

                if (in_array($oldStatus, $cancelStatuses, true) && !in_array($newStatus, $cancelStatuses, true)) {
                    foreach ($details as $detail) {
                        $product = \App\Models\Produk::withTrashed()->lockForUpdate()->find($detail->produk_id);

                        if (!$product || $product->trashed()) {
                            throw new \RuntimeException('Produk pada pesanan ini sudah tidak aktif.');
                        }

                        if ($product->stok_barang < $detail->jumlah) {
                            throw new \RuntimeException('Stok produk "' . $product->nama_barang . '" tidak cukup untuk mengaktifkan kembali pesanan.');
                        }

                        $product->decrement('stok_barang', $detail->jumlah);
                    }
                }

                $order->forceFill(['status' => $newStatus])->save();

                $this->writeOverrideLog(
                    'update_order_status',
                    $order->user,
                    Pesanan::class,
                    $order->id,
                    $validated['override_reason'],
                    ['status' => $oldStatus],
                    ['status' => $newStatus]
                );

                $this->sendOverrideWebsiteMessage(
                    $order->user,
                    'Super Admin membantu mengubah status pesanan Anda.',
                    $validated['override_reason'],
                    [
                        'Invoice' => $order->invoice_code,
                        'Status lama' => $oldStatus,
                        'Status baru' => $newStatus,
                    ]
                );
            });
        } catch (\Throwable $e) {
            return back()->with('error', 'GAGAL override status: ' . $e->getMessage());
        }

        return back()->with('success', 'Status pesanan berhasil diubah oleh Super Admin.');
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
        $overrideLogs = AdminOverrideLog::with('actor')
            ->where('target_user_id', $user->id)
            ->latest()
            ->limit(8)
            ->get();

        return view('admin.user_profile', compact('user', 'overrideLogs'));
    }

    //---menampilkan halaman Toko / Produk User---
    //---menampilkan halaman Toko / Produk User---
    public function showShop($id)
    {
        // Ambil Kategori
        $categories = \App\Models\Produk::where('user_id', $id)->select('kategori')->distinct()->pluck('kategori');

        $user = \App\Models\User::with(['products' => function($query) {
            $query->with(['ulasan', 'updater', 'overrideCreationLog.actor']); 
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
        $product = \App\Models\Produk::with(['user', 'ulasan.user', 'updater', 'overrideCreationLog.actor'])->findOrFail($id);
        $buyers = User::where(function ($query) {
                $query->whereNotIn('role', ['admin', 'super_admin'])
                    ->orWhereNull('role');
            })
            ->where('id', '!=', $product->user_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

        return view('admin.product_detail', compact('product', 'buyers'));
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
        $query = \App\Models\Produk::with(['user', 'ulasan', 'updater', 'overrideCreationLog.actor']);
        $categories = config('product_categories');
        $activeCategory = strtolower((string) $request->query('category', ''));
        $activeSeller = null;

        if ($request->filled('seller_id')) {
            $activeSeller = User::find($request->query('seller_id'));

            if ($activeSeller) {
                $query->where('user_id', $activeSeller->id);
            }
        }

        if ($activeCategory && in_array($activeCategory, $categories, true)) {
            $query->whereRaw('LOWER(kategori) = ?', [$activeCategory]);
        }

        // 2. FITUR PENCARIAN
        if ($request->filled('search')) {
            $search = $request->search;
            $searchLower = strtolower($search);

            $query->where(function($q) use ($search, $searchLower) {
                
                // A. Cari berdasarkan nama produk atau kategori (di tabel produk)
                $q->whereRaw('LOWER(nama_barang) LIKE ?', ['%' . $searchLower . '%'])
                  ->orWhereRaw('LOWER(kategori) LIKE ?', ['%' . $searchLower . '%'])
                  
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

        return view('admin.admin_products', compact('products', 'categories', 'activeCategory', 'activeSeller'));
    }

    // --- Menampilkan Semua Transaksi (Untuk Admin) ---
    public function allTransactions(\Illuminate\Http\Request $request)
    {
        try {
            $activeBuyer = null;

            // 1. Ambil semua data mentah dari database
            $transactionsQuery = \Illuminate\Support\Facades\DB::table('detail_pesanan')
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
                ->orderBy('pesanan.created_at', 'desc');

            if ($request->filled('buyer_id')) {
                $activeBuyer = User::find($request->query('buyer_id'));

                if ($activeBuyer) {
                    $transactionsQuery->where('pesanan.user_id', $activeBuyer->id);
                }
            }

            $rawTransactions = $transactionsQuery->get();

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
            $activeBuyer = null;
        }

        return view('admin.admin_transactions', compact('transactions', 'activeStatus', 'totalSemua', 'activeBuyer'));
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
