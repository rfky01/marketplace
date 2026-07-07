<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil Lengkap - {{ $user->name }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-100 font-sans min-h-screen pb-10">

    @php
        $requestedBackUrl = request('profile_back_url');
        $appUrl = url('/');
        $isSafeBackUrl = $requestedBackUrl
            && (
                str_starts_with($requestedBackUrl, $appUrl)
                || str_starts_with($requestedBackUrl, '/')
            );
        $prevUrl = $isSafeBackUrl ? $requestedBackUrl : url()->previous();
        
        // Atur fallback jika halaman ini di-refresh (mencegah tombol kembali ke halaman ini sendiri)
        if ($prevUrl === url()->current()) {
            $backUrl = route('admin.users'); // Default: Kembali ke kelola pengguna
            $backText = 'Kembali ke Daftar Pengguna';
        } else {
            $backUrl = $prevUrl;
            
            // Deteksi teks cerdas berdasarkan URL asal
            if (str_contains($prevUrl, '/shop')) {
                $backText = 'Kembali ke Etalase Toko';
            } elseif (str_contains($prevUrl, '/products/')) {
                $backText = 'Kembali ke Detail Produk';
            } elseif (str_contains($prevUrl, '/products')) {
                $backText = 'Kembali ke Semua Produk';
            } elseif (str_contains($prevUrl, '/users')) {
                $backText = 'Kembali ke Kelola Pengguna';
            } else {
                $backText = 'Kembali';
            }
        }

        $profileBackUrl = $backUrl;
    @endphp

    <nav class="bg-indigo-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div class="container mx-auto flex items-center gap-4">
            <a href="{{ $backUrl }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
                <span class="font-bold text-sm">{{ $backText }}</span>
            </a>
            <h1 class="text-xl font-bold border-l border-indigo-700 pl-4 ml-2">Detail Pengguna Lengkap</h1>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8">
        <div class="max-w-6xl mx-auto">
            @if(session('success'))
                <div class="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                    {{ session('success') }}
                </div>
            @endif

            @if(session('error'))
                <div class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {{ session('error') }}
                </div>
            @endif

            @if ($errors->any())
                <div class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <ul class="list-disc pl-5">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
            
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 relative">
                
                @php
                    // Ambil KATA PERTAMA dari nama user dan jadikan huruf kapital
                    $namaDepan = strtoupper(explode(' ', trim($user->name))[0]);
                @endphp

                @if($user->products->count() > 0)
                    @php
                        $firstProduct = $user->products->sortBy('created_at')->first();
                        $sellerSinceDate = $firstProduct ? $firstProduct->created_at : $user->created_at;
                    @endphp
                    <div class="h-40 bg-gradient-to-r from-green-500 to-emerald-600 relative overflow-hidden">
                        
                        <div class="absolute inset-0 opacity-20" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px);"></div>
                        
                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none mix-blend-overlay z-0 w-full text-center">
                            <span class="text-[8rem] md:text-[10rem] font-black text-white/30 leading-none tracking-tighter">{{ $namaDepan }}</span>
                        </div>
                        
                        <div class="absolute top-4 left-8 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/40 text-white font-medium text-sm flex items-center gap-2 shadow-sm z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Penjual sejak {{ \Carbon\Carbon::parse($sellerSinceDate)->translatedFormat('d F Y') }}
                        </div>

                        <div class="absolute top-4 right-6 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/40 text-white font-extrabold text-sm flex items-center gap-2 shadow-sm z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-200" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Toko Aktif
                        </div>
                    </div>
                @else
                    <div class="h-40 bg-gradient-to-r from-blue-600 to-indigo-800 relative overflow-hidden">
                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none mix-blend-overlay z-0 w-full text-center">
                            <span class="text-[8rem] md:text-[10rem] font-black text-white/20 leading-none tracking-tighter">{{ $namaDepan }}</span>
                        </div>
                    </div>
                @endif
                <div class="px-8 pb-8 flex flex-col md:flex-row -mt-16 gap-6 md:gap-8 relative z-10">
                    
                    <div class="relative flex-shrink-0 mx-auto md:mx-0">
                        <img class="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                             src="{{ $user->profile_photo ? asset('storage/' . $user->profile_photo) : 'https://ui-avatars.com/api/?name='.urlencode($user->name).'&background=random&color=fff&size=256' }}" 
                             alt="{{ $user->name }}">
                        
                        <div class="absolute bottom-2 right-2">
                            @if($user->products->count() > 0)
                                <span class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow-sm flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Penjual
                                </span>
                            @else
                                <span class="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow-sm flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    Pembeli
                                </span>
                            @endif
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col md:flex-row justify-between items-center md:items-start md:pt-20">
                        
                        <div class="text-center md:text-left mb-6 md:mb-0">
                            <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">{{ $user->name }}</h1>
                            <p class="text-gray-500 font-medium text-sm md:text-base">{{ $user->email }}</p>
                            @if($user->bio)
                                <p class="text-gray-600 mt-2 italic leading-relaxed max-w-xl">"{{ $user->bio }}"</p>
                            @endif
                        </div>

                        <div class="flex-shrink-0 md:mt-2">
                            <button type="button" onclick="openCenterChat({{ $user->id }}, '{{ addslashes($user->name) }}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition flex items-center gap-2 cursor-pointer border-none outline-none">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Chat User
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div class="bg-white rounded-xl shadow-md p-6 h-fit">
                    <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Data Pribadi
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Nomor HP / WhatsApp</label>
                            <span class="text-gray-800 font-medium bg-gray-50 px-3 py-1 rounded block mt-1 border">
                                {{ $user->phone ?? $user->no_hp ?? '-' }}
                            </span>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Jenis Kelamin</label>
                            <span class="text-gray-800 font-medium block mt-1">
                                {{ $user->jenis_kelamin ?? '-' }}
                            </span>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Tanggal Lahir</label>
                            <span class="text-gray-800 font-medium block mt-1">
                                {{ $user->tanggal_lahir ? \Carbon\Carbon::parse($user->tanggal_lahir)->format('d F Y') : '-' }}
                            </span>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Alamat Lengkap</label>
                            <p class="text-gray-800 text-sm mt-1 leading-relaxed bg-gray-50 p-2 rounded border">
                                {{ $user->address ?? $user->alamat ?? '-' }}
                            </p>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Bergabung Sejak</label>
                            <span class="text-gray-800 text-sm mt-1 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {{ $user->created_at->format('d F Y, H:i') }}
                            </span>
                        </div>
                    </div>

                    @if(auth()->user()?->isSuperAdmin() && !$user->isSuperAdmin() && auth()->id() !== $user->id)
                        <div class="mt-6 border-t border-gray-100 pt-5">
                            <h4 class="mb-3 text-sm font-extrabold text-red-700">Override Bantuan Login</h4>
                            <form method="POST" action="{{ route('admin.users.override-password', $user->id) }}" class="space-y-3">
                                @csrf
                                <div>
                                    <label class="text-xs font-bold text-gray-400 uppercase block mb-1">Password Sementara</label>
                                    <input type="password" name="temporary_password" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" required>
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-400 uppercase block mb-1">Konfirmasi Password</label>
                                    <input type="password" name="temporary_password_confirmation" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" required>
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-gray-400 uppercase block mb-1">Alasan Override</label>
                                    <textarea name="override_reason" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" placeholder="Contoh: User tidak bisa login dan meminta reset password." required></textarea>
                                </div>
                                <button type="submit" class="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700" onclick="return confirm('Reset password user ini sebagai override Super Admin?')">
                                    Reset Password User
                                </button>
                            </form>
                        </div>
                    @endif
                </div>

                <div class="bg-white rounded-xl shadow-md p-6 h-fit">
                    <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        Identitas
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">NIK (Nomor Induk Kependudukan)</label>
                            <span class="text-indigo-700 font-bold text-lg block mt-1">
                                {{ $user->nik ?? '-' }}
                            </span>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Dusun / RT / RW</label>
                            <span class="text-gray-800 font-medium block mt-1">
                                {{ $user->dusun_rt_rw ?? '-' }}
                            </span>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">nik</label>
                            <span class="text-gray-800 font-medium block mt-1">
                                {{ $user->nik ?? '-' }}
                            </span>
                        </div>
                        
                        <div class="mt-6">
                            <label class="text-xs font-bold text-gray-400 uppercase block mb-2">Kartu Tanda Penduduk (KTP)</label>
                            @if($user->ktp_image)
                                <a href="{{ asset('storage/' . $user->ktp_image) }}" target="_blank" class="group relative block overflow-hidden rounded-lg border hover:shadow-lg transition">
                                    <img src="{{ asset('storage/' . $user->ktp_image) }}" class="w-full h-40 object-cover group-hover:scale-105 transition duration-500">
                                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <span class="text-white font-bold text-sm flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Lihat Fullscreen
                                        </span>
                                    </div>
                                </a>
                            @else
                                <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center text-gray-400 text-sm">
                                    Tidak ada foto KTP
                                </div>
                            @endif
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-6 h-fit border border-gray-100 flex flex-col">
                    <h3 class="font-bold text-lg text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Grafik Keaktifan
                    </h3>

                    @php
                        // Hitung Aksi Upload dan Beli secara langsung
                        $totalUpload = $user->products->count();
                        $totalBeli = \Illuminate\Support\Facades\DB::table('pesanan')->where('user_id', $user->id)->count();

                        // Kalkulasi Persentase Proporsional
                        $totalAktivitas = $totalUpload + $totalBeli;
                        $persenUpload = $totalAktivitas > 0 ? round(($totalUpload / $totalAktivitas) * 100) : 0;
                        $persenBeli = $totalAktivitas > 0 ? round(($totalBeli / $totalAktivitas) * 100) : 0;
                    @endphp

                    @if($totalAktivitas == 0)
                        <div class="flex-1 flex flex-col items-center justify-center py-10">
                            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                            </div>
                            <p class="text-gray-400 text-sm font-medium">Belum ada aktivitas</p>
                        </div>
                    @else
                        <div class="relative w-full max-w-[180px] mx-auto mb-6 aspect-square">
                            <canvas id="keaktifanChart"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                                <span class="text-3xl font-extrabold text-gray-800 leading-none">{{ $totalAktivitas }}</span>
                                <span class="text-[10px] text-gray-400 font-bold uppercase mt-1">Total Aksi</span>
                            </div>
                        </div>

                        <div class="space-y-3 mt-auto">
                            <a href="{{ route('admin.transactions', ['buyer_id' => $user->id, 'profile_back_url' => $profileBackUrl]) }}" class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-200 hover:shadow-md transition decoration-none group">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                    </div>
                                    <div>
                                        <span class="block text-xs font-bold text-gray-700">Beli Barang</span>
                                        <span class="block text-[10px] text-gray-500">{{ $totalBeli }} transaksi</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="block text-lg font-extrabold text-blue-600">{{ $persenBeli }}%</span>
                                </div>
                            </a>

                            @if($totalUpload > 0)
                            <a href="{{ route('admin.products', ['seller_id' => $user->id, 'profile_back_url' => $profileBackUrl]) }}" class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100 hover:border-green-200 hover:shadow-md transition decoration-none group">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-105 transition">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    </div>
                                    <div>
                                        <span class="block text-xs font-bold text-gray-700">Upload Produk</span>
                                        <span class="block text-[10px] text-gray-500">{{ $totalUpload }} produk</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="block text-lg font-extrabold text-green-600">{{ $persenUpload }}%</span>
                                </div>
                            </a>
                            @endif
                        </div>

                        <script src="https://cdn.jsdelivr.net/nik/chart.js"></script>
                        <script>
                            document.addEventListener("DOMContentLoaded", function() {
                                const ctx = document.getElementById('keaktifanChart');
                                if(ctx) {
                                    // Cek apakah dia penjual atau pembeli
                                    const isSeller = {{ $totalUpload > 0 ? 'true' : 'false' }};
                                    
                                    // Atur Label dan Data secara dinamis berdasarkan perannya
                                    const labels = isSeller ? ['Beli Barang', 'Upload Produk'] : ['Beli Barang'];
                                    const data = isSeller ? [{{ $totalBeli }}, {{ $totalUpload }}] : [{{ $totalBeli }}];
                                    const bgColors = isSeller ? ['#3b82f6', '#22c55e'] : ['#3b82f6'];

                                    new Chart(ctx, {
                                        type: 'doughnut',
                                        data: {
                                            labels: labels,
                                            datasets: [{
                                                data: data,
                                                backgroundColor: bgColors,
                                                borderWidth: 0,
                                                hoverOffset: 4
                                            }]
                                        },
                                        options: {
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            cutout: '75%', // Mengatur ketebalan cincin donut
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            return ' ' + context.label + ': ' + context.parsed + ' kali aksi';
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        </script>
                    @endif
                </div>

            </div>

            @if(auth()->user()?->isSuperAdmin())
                <div class="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-md">
                    <h3 class="mb-4 flex items-center gap-2 text-lg font-extrabold text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6M9 8h6m2 13H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                        </svg>
                        Riwayat Override User
                    </h3>

                    @if(($overrideLogs ?? collect())->isEmpty())
                        <p class="text-sm text-gray-500">Belum ada override yang tercatat untuk user ini.</p>
                    @else
                        <div class="space-y-3">
                            @foreach($overrideLogs as $log)
                                <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <p class="text-sm font-extrabold text-gray-800">{{ ucwords(str_replace('_', ' ', $log->action)) }}</p>
                                        <p class="text-xs font-semibold text-gray-400">{{ $log->created_at->format('d M Y, H:i') }}</p>
                                    </div>
                                    <p class="mt-1 text-xs text-gray-500">Oleh: {{ $log->actor->name ?? 'Super Admin' }}</p>
                                    <p class="mt-2 text-sm text-gray-700">{{ $log->reason }}</p>
                                </div>
                            @endforeach
                        </div>
                    @endif
                </div>
            @endif

        </div>
    </div>

    @include('admin.popup.chat_popup_center')

</body>
</html>
