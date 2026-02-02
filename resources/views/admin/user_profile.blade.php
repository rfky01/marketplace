<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profil Lengkap - {{ $user->name }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 font-sans min-h-screen pb-10">

    <nav class="bg-indigo-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div class="container mx-auto flex items-center gap-4">
            <a href="{{ route('admin.users.shop', $user->id) }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
                <span class="font-bold text-sm">Kembali ke Toko</span>
            </a>
            <h1 class="text-xl font-bold border-l border-indigo-700 pl-4 ml-2">Detail Pengguna Lengkap</h1>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8">
        <div class="max-w-6xl mx-auto">
            
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 relative">
                <div class="h-40 bg-gradient-to-r from-blue-600 to-indigo-800"></div>
                
                <div class="px-8 pb-8 flex flex-col md:flex-row items-end -mt-16 gap-6">
                    <div class="relative">
                        <img class="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover bg-white"
                             src="{{ $user->profile_photo ? asset('storage/' . $user->profile_photo) : 'https://ui-avatars.com/api/?name='.urlencode($user->name).'&background=random&color=fff&size=256' }}" 
                             alt="{{ $user->name }}">
                        
                        <div class="absolute bottom-2 right-2">
                            @if($user->products_count > 0)
                                <span class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow-sm flex items-center gap-1">
                                    🏪 Penjual
                                </span>
                            @else
                                <span class="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow-sm flex items-center gap-1">
                                    👤 Pembeli
                                </span>
                            @endif
                        </div>
                    </div>

                    <div class="flex-1 mb-2 text-center md:text-left">
                        <h1 class="text-3xl font-bold text-gray-900">{{ $user->name }}</h1>
                        <p class="text-gray-500 font-medium">{{ $user->email }}</p>
                        @if($user->bio)
                            <p class="text-gray-600 mt-2 italic">"{{ $user->bio }}"</p>
                        @endif
                    </div>

                    <div class="flex gap-3 mb-4">
                        <a href="{{ route('admin.chats', $user->id) }}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow transition flex items-center gap-2">
                            💬 Chat User
                        </a>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div class="bg-white rounded-xl shadow-md p-6 h-fit">
                    <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        👤 Data Pribadi
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
                            <span class="text-gray-800 text-sm block mt-1">
                                📅 {{ $user->created_at->format('d F Y, H:i') }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-6 h-fit">
                    <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        🎓 Data Akademik
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">NPM (Nomor Pokok Mahasiswa)</label>
                            <span class="text-indigo-700 font-bold text-lg block mt-1">
                                {{ $user->npm ?? '-' }}
                            </span>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Program Studi</label>
                            <span class="text-gray-800 font-medium block mt-1">
                                {{ $user->prodi ?? '-' }}
                            </span>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-400 uppercase block">Fakultas</label>
                            <span class="text-gray-800 font-medium block mt-1">
                                {{ $user->fakultas ?? '-' }}
                            </span>
                        </div>
                        
                        <div class="mt-6">
                            <label class="text-xs font-bold text-gray-400 uppercase block mb-2">Kartu Tanda Mahasiswa (KTM)</label>
                            @if($user->ktm_image)
                                <a href="{{ asset('storage/' . $user->ktm_image) }}" target="_blank" class="group relative block overflow-hidden rounded-lg border hover:shadow-lg transition">
                                    <img src="{{ asset('storage/' . $user->ktm_image) }}" class="w-full h-40 object-cover group-hover:scale-105 transition duration-500">
                                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <span class="text-white font-bold text-sm">🔍 Lihat Fullscreen</span>
                                    </div>
                                </a>
                            @else
                                <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center text-gray-400 text-sm">
                                    Tidak ada foto KTM
                                </div>
                            @endif
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-6 h-fit">
                    <h3 class="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        📦 Statistik Toko
                    </h3>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                            <span class="block text-2xl font-bold text-blue-600">{{ $user->products->count() }}</span>
                            <span class="text-xs text-blue-600 uppercase font-bold">Produk</span>
                        </div>
                        <div class="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                            <span class="block text-2xl font-bold text-green-600">Aktif</span>
                            <span class="text-xs text-green-600 uppercase font-bold">Status Akun</span>
                        </div>
                    </div>

                    @if($user->products->count() > 0)
                        <h4 class="font-bold text-sm text-gray-700 mb-3">Produk Terbaru:</h4>
                        <div class="space-y-3">
                            @foreach($user->products->take(3) as $product)
                            <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border hover:bg-gray-100 transition">
                                <div class="w-12 h-12 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                                    @if($product->image)
                                        <img src="{{ asset('storage/'.$product->image) }}" class="w-full h-full object-cover">
                                    @endif
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h5 class="text-sm font-bold text-gray-800 truncate">{{ $product->name }}</h5>
                                    <p class="text-xs text-green-600 font-bold">Rp {{ number_format($product->price, 0, ',', '.') }}</p>
                                </div>
                            </div>
                            @endforeach
                            
                            @if($user->products->count() > 3)
                                <div class="text-center mt-2">
                                    <span class="text-xs text-gray-500">+ {{ $user->products->count() - 3 }} produk lainnya</span>
                                </div>
                            @endif
                        </div>
                    @else
                        <div class="text-center py-8 text-gray-400 text-sm">
                            User ini belum mengupload produk apapun.
                        </div>
                    @endif
                </div>

            </div>

        </div>
    </div>

</body>
</html>