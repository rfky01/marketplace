<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toko: {{ $user->name }}</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-blue-50 min-h-screen pb-20">

    <nav class="bg-indigo-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div class="container mx-auto flex items-center gap-4">
            <a href="{{ route('admin.users') }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
            </a>
            <h1 class="text-xl font-bold">Etalase Toko: {{ $user->name }}</h1>
        </div>
    </nav>

    <div class="w-[90%] mx-auto pt-1">
        
        <div class="sticky top-16 z-40 bg-blue-50 pb-1 transition-all duration-300">
            
            <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-1 flex items-center">
                
                <div class="flex items-center gap-6">
                    
                    <a href="{{ route('admin.users.profile', $user->id) }}" class="group relative block" title="Lihat Profil Lengkap">
                        @if($user->profile_photo)
                            <img src="{{ asset('storage/' . $user->profile_photo) }}" class="w-16 h-16 rounded-full object-cover border border-gray-200 group-hover:scale-105 transition duration-200 group-hover:ring-4 group-hover:ring-blue-100">
                        @else
                            <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-xl group-hover:scale-105 transition duration-200 group-hover:ring-4 group-hover:ring-blue-100">
                                {{ substr($user->name, 0, 1) }}
                            </div>
                        @endif
                    </a>
                    
                    <div>
                        <a href="{{ route('admin.users.profile', $user->id) }}" class="group flex items-center gap-2 hover:text-blue-700 transition decoration-none" title="Lihat Profil Lengkap">
                            <h2 class="text-xl font-bold text-gray-800 group-hover:text-blue-700">{{ $user->name }}</h2>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -ml-1 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </a>

                        <p class="text-gray-500 text-sm mb-2">{{ $user->email }}</p>
                        
                        <div class="mt-1">
                            <button type="button" onclick="openCenterChat({{ $user->id }}, '{{ addslashes($user->name) }}')" class="bg-green-100 text-green-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition cursor-pointer inline-flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Chat Penjual
                            </button>
                        </div>
                    </div>
                </div>

                <div class="ml-auto flex items-center">

                    <a href="{{ route('admin.users.shop.orders', $user->id) }}" class="flex items-center gap-4 px-6 border-r border-gray-100 hover:bg-purple-50 transition cursor-pointer group decoration-none" title="Klik untuk lihat detail pesanan">
                        <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 group-hover:text-purple-700">Produk Terjual</p>
                            <p class="text-2xl font-extrabold text-gray-800 group-hover:text-purple-700 transition">
                                {{ $totalTerjual }} <span class="text-[10px] font-medium text-gray-400 group-hover:text-purple-500">Pcs</span>
                            </p>
                        </div>
                    </a>

                    <div class="flex items-center gap-4 px-8 border-r border-gray-100">
                        <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Produk</p>
                            <p class="text-2xl font-extrabold text-gray-800">
                                {{ $user->products->count() }} <span class="text-xs font-medium text-gray-400">Item</span>
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-6 px-8">
                        <div class="text-center">
                            <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Performa Toko</p>
                            <div class="flex items-center gap-2 justify-center">
                                <svg class="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span class="text-3xl font-extrabold text-gray-800">{{ $rataRataToko }}</span>
                                <span class="text-gray-400 text-sm font-medium self-end mb-1">/ 5.0</span>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Dari <b>{{ $totalUlasanToko }}</b> Ulasan</p>
                        </div>
                        
                        <div class="relative w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border-4 border-blue-100">
                            <span class="text-blue-700 font-bold text-xs">{{ $persentase }}%</span>
                        </div>
                    </div>

                </div>
            </div>

            <form method="GET" action="{{ route('admin.users.shop', $user->id) }}" class="flex flex-col md:flex-row justify-between items-center gap-4">
                
                <div class="flex items-center bg-white rounded-lg px-3 py-2 w-full md:max-w-[500px] border border-gray-200 focus-within:border-blue-900 shadow-sm transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    
                    <input 
                        type="text" name="search" placeholder="Cari di Toko ini" 
                        value="{{ request('search') }}"
                        class="bg-transparent outline-none text-sm w-full text-gray-700 placeholder-gray-400"
                        onchange="this.form.submit()"
                    />

                    <div class="h-5 w-px bg-gray-300 mx-2"></div>

                    <select name="category" class="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer max-w-[150px] truncate hover:text-blue-900" onchange="this.form.submit()">
                        <option value="">Semua Kategori</option>
                        @foreach($categories as $cat)
                            <option value="{{ $cat }}" {{ request('category') == $cat ? 'selected' : '' }}>{{ $cat }}</option>
                        @endforeach
                    </select>
                </div>

                <div class="w-full md:w-auto">
                    <select name="sort" class="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg py-2.5 px-3 w-full md:w-32 outline-none focus:border-blue-900 transition cursor-pointer hover:bg-gray-50 shadow-sm" onchange="this.form.submit()">
                        <option value="">Urutkan</option>
                        <option value="lowest" {{ request('sort') == 'lowest' ? 'selected' : '' }}>Termurah</option>
                        <option value="highest" {{ request('sort') == 'highest' ? 'selected' : '' }}>Termahal</option>
                    </select>
                </div>

            </form>
        </div>

        @if($user->products->count() > 0)
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                @foreach($user->products as $product)
                
                @php
                    // LOGIKA PHP UNTUK MEMPROSES FOTO JSON KE ARRAY
                    $rawFoto = $product->foto_barang;
                    $fotos = [];

                    if (is_string($rawFoto)) {
                        $decoded = json_decode($rawFoto, true);
                        if (is_array($decoded) && count($decoded) > 0) {
                            $fotos = $decoded;
                        } else {
                            // Jika string biasa (bukan json), jadikan array tunggal
                            $fotos = [$rawFoto]; 
                        }
                    } elseif (is_array($rawFoto)) {
                        $fotos = $rawFoto;
                    }

                    // Bersihkan path 'public/' dari setiap foto
                    $fotos = array_map(function($f) {
                        return str_replace('public/', '', $f);
                    }, $fotos);
                    
                    // Default jika kosong
                    if (empty($fotos)) $fotos = [null]; 

                    // --- BAGIAN INI SAYA TAMBAHKAN UNTUK RATING ---
                    $jumlahUlasan = $product->ulasan->count(); 
                    $rataRata = $jumlahUlasan > 0 ? number_format($product->ulasan->avg('rating'), 1) : '0.0';

                    $totalRatingToko = 0;
                    $totalUlasanToko = 0;

                    foreach($user->products as $p) {
                        if($p->ulasan) {
                            foreach($p->ulasan as $u) {
                                $totalRatingToko += $u->rating;
                                $totalUlasanToko++;
                            }
                        }
                    }

                    // Hindari pembagian dengan nol
                    $rataRataToko = $totalUlasanToko > 0 ? number_format($totalRatingToko / $totalUlasanToko, 1) : '0.0';
                    
                    // Hitung Persentase (Opsional, misal 4.5/5 = 90%)
                    $persentase = $totalUlasanToko > 0 ? round(($totalRatingToko / ($totalUlasanToko * 5)) * 100) : 0;
                @endphp

                <a href="{{ route('admin.products.show', $product->id) }}" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition duration-300 transform hover:-translate-y-1 flex flex-col h-full group relative cursor-pointer block">                    
                    <div x-data="{ activeSlide: 0, slides: {{ count($fotos) }} }" class="relative w-full pt-[100%] bg-gray-100 overflow-hidden">
                        
                        @foreach($fotos as $index => $foto)
                            <div x-show="activeSlide === {{ $index }}" 
                                 class="absolute inset-0 w-full h-full transition-opacity duration-300"
                                 x-transition:enter="transition ease-out duration-300"
                                 x-transition:enter-start="opacity-0"
                                 x-transition:enter-end="opacity-100"
                                 x-transition:leave="transition ease-in duration-300"
                                 x-transition:leave-start="opacity-100"
                                 x-transition:leave-end="opacity-0">
                                
                                @if($foto)
                                    <img src="{{ asset('storage/' . $foto) }}" class="w-full h-full object-cover">
                                @else
                                    <div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                        <span class="text-xs">No Image</span>
                                    </div>
                                @endif
                            </div>
                        @endforeach

                        @if($product->stok_barang <= 0)
                            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                                <span class="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">HABIS</span>
                            </div>
                        @endif

                        @if(count($fotos) > 1)
                            <button @click.prevent="activeSlide = activeSlide === 0 ? slides - 1 : activeSlide - 1" 
                                    class="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition duration-200 z-20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <button @click.prevent="activeSlide = activeSlide === slides - 1 ? 0 : activeSlide + 1" 
                                    class="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition duration-200 z-20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
                                <template x-for="i in slides">
                                    <div class="w-1.5 h-1.5 rounded-full transition-colors duration-200 shadow-sm"
                                         :class="activeSlide === i - 1 ? 'bg-white' : 'bg-white/50'"></div>
                                </template>
                            </div>
                        @endif

                    </div>

                    <div class="p-3 flex flex-col flex-1">
                        <h3 class="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug hover:text-blue-900 transition min-h-[40px]" title="{{ $product->nama_barang }}">
                            {{ $product->nama_barang }}
                        </h3>

                        <div class="mb-1">
                            <span class="text-gray-800 font-bold text-base">
                                Rp {{ number_format($product->harga_barang, 0, ',', '.') }}
                            </span>
                        </div>

                        <p class="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-3">
                            {{ $product->kategori }}
                        </p>
                        
                        <div class="flex items-center gap-1 mb-2">
                            <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            <span class="text-xs font-bold text-gray-600">{{ $rataRata }}</span>
                            <span class="text-[10px] text-gray-400">({{ $jumlahUlasan }})</span>
                        </div>
                        <div class="flex items-center gap-1 mt-auto">
                            <span class="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                                Stok {{ $product->stok_barang }}
                            </span>
                            <span class="text-[10px] text-gray-400 truncate max-w-[100px] ml-auto">
                                {{ explode(' ', $user->name)[0] }}
                            </span>
                        </div>
                    </div>

                </a>
                @endforeach
            </div>
            
            @if($paginatedProducts->hasPages())
            <div class="mt-10 mb-4 flex justify-center">
                <div class="flex items-center gap-4 text-sm font-medium bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-200">
                    
                    {{-- Tombol Sebelumnya --}}
                    @if (!$paginatedProducts->onFirstPage())
                        <a href="{{ $paginatedProducts->previousPageUrl() }}" class="text-blue-600 hover:text-blue-800 transition font-bold">« Sebelumnya</a>
                    @endif

                    {{-- Angka Halaman --}}
                    <div class="flex items-center gap-2">
                        @foreach(range(1, $paginatedProducts->lastPage()) as $i)
                            @if($i >= $paginatedProducts->currentPage() - 2 && $i <= $paginatedProducts->currentPage() + 2)
                                @if($i == $paginatedProducts->currentPage())
                                    <span class="text-white font-bold text-sm bg-blue-600 w-8 h-8 flex items-center justify-center rounded-full shadow-md">{{ $i }}</span>
                                @else
                                    <a href="{{ $paginatedProducts->url($i) }}" class="text-gray-500 hover:text-blue-600 font-bold transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 border border-transparent hover:border-blue-100">{{ $i }}</a>
                                @endif
                            @endif
                        @endforeach
                    </div>

                    {{-- Tombol Berikutnya --}}
                    @if ($paginatedProducts->hasMorePages())
                        <a href="{{ $paginatedProducts->nextPageUrl() }}" class="text-blue-600 hover:text-blue-800 transition font-bold">Berikutnya »</a>
                    @endif
                </div>
            </div>
            @endif
        @else
            <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm">
                <div class="bg-gray-50 p-6 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <p class="text-gray-500 font-medium">Toko ini belum memiliki produk.</p>
            </div>
        @endif

    </div>
    @include('admin.popup.chat_popup_center')
</body>
</html>