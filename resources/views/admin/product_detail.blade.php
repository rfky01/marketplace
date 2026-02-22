<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $product->nama_barang }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="bg-blue-50 min-h-screen pb-20">

    @php
        $prevUrl = url()->previous();
        
        // 1. SIMPAN JEJAK KE MEMORI (SESSION):
        // Jika Admin datang dari "Semua Produk", simpan URL pencariannya.
        if (str_contains($prevUrl, '/products') && !str_contains($prevUrl, '/products/' . $product->id)) {
            session(['product_back_url' => $prevUrl, 'product_back_text' => 'Kembali ke Semua Produk']);
        } 
        // Jika Admin datang dari "Etalase Toko", simpan URL pencariannya.
        elseif (str_contains($prevUrl, '/shop')) {
            session(['product_back_url' => $prevUrl, 'product_back_text' => 'Kembali ke Toko']);
        }
        
        // 2. AMBIL JEJAK DARI MEMORI:
        // Jika Admin kembali dari "Profil", kondisi if di atas akan terabaikan (karena URL-nya /profile).
        // Hasilnya? Memori (Session) tidak tertimpa, dan Admin tetap kembali ke jejak aslinya dengan sempurna!
        $backUrl = session('product_back_url', route('admin.users.shop', $product->user_id));
        $backText = session('product_back_text', 'Kembali ke Toko');
    @endphp

    <nav class="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
        <div class="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
            <div class="flex items-center gap-4">
                <a href="{{ $backUrl }}" class="flex items-center gap-2 text-gray-500 hover:text-blue-900 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span class="font-bold text-sm">{{ $backText }}</span>
                </a>
            </div>
            <div class="flex items-center gap-6">
                <a href="{{ route('admin.dashboard') }}" class="text-blue-900 font-bold text-lg tracking-tight">
                    Admin<span class="text-gray-700">Panel</span>
                </a>
            </div>
        </div>
    </nav>

    @php
        $rawFoto = $product->foto_barang;
        $images = [];
        if (is_string($rawFoto)) {
            $decoded = json_decode($rawFoto, true);
            $images = (is_array($decoded) && count($decoded) > 0) ? $decoded : [$rawFoto];
        } elseif (is_array($rawFoto)) {
            $images = $rawFoto;
        }
        // Bersihkan path
        $images = array_map(function($img) { return str_replace('public/', '', $img); }, $images);
        $mainImage = count($images) > 0 ? $images[0] : null;
    @endphp

    <div class="max-w-6xl mx-auto px-4" x-data="{ mainImage: '{{ $mainImage }}', expanded: false }">
        
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div class="flex flex-col md:flex-row items-start relative">
                
                <div class="w-full md:w-5/12 lg:w-4/12 bg-gray-50 p-4 sticky top-28 self-start z-10 rounded-l-2xl flex flex-col items-center">
                    
                    <div class="relative w-full max-w-xs aspect-square bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-4 group">
                        @if($mainImage)
                            <img :src="'/storage/' + mainImage" 
                                 class="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                                 alt="Produk">
                        @else
                            <div class="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                        @endif
                    </div>

                    @if(count($images) > 1)
                    <div class="w-full max-w-xs mt-4 mx-auto">
                        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                            @foreach($images as $img)
                                <div @click="mainImage = '{{ $img }}'" 
                                     class="w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition flex-shrink-0"
                                     :class="mainImage === '{{ $img }}' ? 'border-blue-600 opacity-100 ring-2 ring-blue-100' : 'border-gray-200 opacity-60 hover:opacity-100'">
                                    <img src="{{ asset('storage/' . $img) }}" class="w-full h-full object-cover">
                                </div>
                            @endforeach
                        </div>
                    </div>
                    @endif

                    <div class="w-full max-w-xs flex gap-3 mt-4 opacity-50 cursor-not-allowed">
                        <button class="flex-1 py-3 border-2 border-gray-300 text-gray-400 font-bold rounded-xl" disabled>+ Keranjang</button>
                        <button class="flex-1 py-3 bg-gray-300 text-white font-bold rounded-xl" disabled>Beli Sekarang</button>
                    </div>
                    <p class="text-xs text-red-500 mt-2 font-medium text-center">*Mode Admin: Tombol beli dinonaktifkan</p>
                </div>

                <div class="w-full md:w-7/12 lg:w-8/12 p-8 flex flex-col border-l border-gray-100">
                    
                    <div class="flex items-center gap-3 mb-4">
                        <span class="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                            {{ $product->kategori }}
                        </span>
                        <span class="text-xs font-bold px-3 py-1 rounded-full border {{ $product->stok_barang > 0 ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50' }}">
                            {{ $product->stok_barang > 0 ? "Stok: {$product->stok_barang} Unit" : 'Stok Habis' }}
                        </span>
                    </div>

                    <h1 class="text-3xl font-extrabold text-gray-900 mb-4 leading-tight break-words">
                        {{ $product->nama_barang }}
                    </h1>
                    <div class="text-4xl font-bold text-blue-600 mb-6 lg:ml-14">
                        Rp {{ number_format($product->harga_barang, 0, ',', '.') }}
                    </div>

                    <div class="mt-4 ml-2 lg:ml-10"> 
                        <h3 class="text-sm font-medium text-gray-900 mb-2">Deskripsi Produk</h3>
                        <div class="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                            <span x-show="!expanded">{{ Str::limit($product->deskripsi, 150) }}</span>
                            <span x-show="expanded">{{ $product->deskripsi }}</span>
                            
                            @if(strlen($product->deskripsi) > 150)
                                <button @click="expanded = !expanded" class="text-blue-600 font-bold ml-1 hover:underline focus:outline-none text-xs">
                                    <span x-text="expanded ? 'Lihat Lebih Sedikit' : 'Lihat Selengkapnya'"></span>
                                </button>
                            @endif
                        </div>
                    </div>

                    <div class="border-t border-gray-100 pt-6 mt-10">
                        <div class="flex flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <a href="{{ route('admin.users.profile', $product->user_id) }}" class="flex flex-row items-center gap-4 hover:opacity-80 transition cursor-pointer decoration-none group">
                                <div class="w-12 h-12 bg-white rounded-full overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm group-hover:ring-2 ring-blue-300 transition">
                                    @if($product->user->profile_photo)
                                        <img src="{{ asset('storage/' . $product->user->profile_photo) }}" class="w-full h-full object-cover">
                                    @else
                                        <div class="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg bg-gray-200">
                                            {{ substr($product->user->name, 0, 1) }}
                                        </div>
                                    @endif
                                </div>
                                <div class="text-left">
                                    <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Penjual</p>
                                    <p class="text-base font-bold text-gray-800">{{ $product->user->name }}</p>
                                </div>
                            </a>
                            
                            <button type="button" onclick="openCenterChat({{ $product->user_id }}, '{{ addslashes($product->user->name) }}')" class="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-sm font-bold text-sm ml-auto cursor-pointer">
                                Chat Penjual
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div class="flex items-center gap-4 mb-8 border-b border-gray-100 pb-4">
                <h2 class="text-xl font-bold text-gray-800">Ulasan Pembeli</h2>
                @php
                    $totalUlasan = $product->ulasan->count();
                    $avgRating = $totalUlasan > 0 ? number_format($product->ulasan->avg('rating'), 1) : '0.0';
                @endphp
                <div class="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <span class="text-yellow-500 font-bold text-lg">★</span>
                    <span class="font-bold text-gray-800">{{ $avgRating }}</span>
                    <span class="text-gray-400 text-sm">/ 5.0</span>
                    <span class="text-gray-300 text-sm mx-1">•</span>
                    <span class="text-gray-500 text-sm font-medium">{{ $totalUlasan }} Ulasan</span>
                </div>
            </div>

            <div class="space-y-8">
                @forelse($product->ulasan as $review)
                    <div class="flex gap-4">
                        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold flex-shrink-0 text-lg border border-gray-200 overflow-hidden">
                            @if($review->user && $review->user->profile_photo)
                                <img src="{{ asset('storage/' . $review->user->profile_photo) }}" class="w-full h-full object-cover">
                            @else
                                {{ substr($review->user->name ?? 'U', 0, 1) }}
                            @endif
                        </div>

                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2 mb-1">
                                    <p class="font-bold text-gray-800 text-sm">{{ $review->user->name ?? 'User Terhapus' }}</p>
                                    <span class="text-gray-300 text-xs">•</span>
                                    <p class="text-xs text-gray-400">{{ $review->created_at->format('d F Y') }}</p>
                                </div>
                            </div>

                            <div class="flex text-yellow-400 text-sm mb-2">
                                @for($i = 0; $i < 5; $i++)
                                    <span class="{{ $i < $review->rating ? 'text-yellow-400' : 'text-gray-200' }}">★</span>
                                @endfor
                            </div>
                            <p class="text-gray-600 text-sm leading-relaxed">{{ $review->comment ?? 'Tidak ada komentar.' }}</p>
                        </div>
                    </div>
                @empty
                    <div class="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                        <div class="opacity-50 grayscale mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <p class="text-gray-500 font-medium">Belum ada ulasan untuk produk ini.</p>
                    </div>
                @endforelse
            </div>
        </div>

    </div>
    @include('admin.popup.chat_popup_center')
</body>
</html>