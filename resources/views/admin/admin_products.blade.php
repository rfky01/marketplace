<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Semua Produk - Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen pb-10">

    <nav class="bg-indigo-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition text-sm font-semibold border border-transparent hover:border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali
                </a>
                <h1 class="text-xl font-bold border-l border-white/20 pl-4">Semua Produk Marketplace</h1>
            </div>
            <div class="text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
                Total: {{ $products->count() }} Produk
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8">
        
        @if($products->isEmpty())
            <div class="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center mt-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 class="text-lg font-bold text-gray-700">Belum Ada Produk</h3>
                <p class="text-gray-500 text-sm mt-1">Saat ini belum ada penjual yang mengunggah produk.</p>
            </div>
        @else
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                @foreach($products as $product)
                    
                    @php
                        // LOGIKA PHP UNTUK MEMPROSES FOTO JSON KE ARRAY
                        $rawFoto = $product->foto_barang;
                        $fotos = [];

                        if (is_string($rawFoto)) {
                            $decoded = json_decode($rawFoto, true);
                            if (is_array($decoded) && count($decoded) > 0) {
                                $fotos = $decoded;
                            } else {
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
                    @endphp

                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col group">
                        
                        <div x-data="{ activeSlide: 0, slides: {{ count($fotos) }} }" class="aspect-square bg-gray-100 relative overflow-hidden group/slider">
                            
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
                                        <img src="{{ asset('storage/' . $foto) }}" alt="{{ $product->nama_barang }}" class="w-full h-full object-cover">
                                    @else
                                        <div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    @endif
                                </div>
                            @endforeach

                            @if(count($fotos) > 1)
                                <button @click.prevent="activeSlide = activeSlide === 0 ? slides - 1 : activeSlide - 1" 
                                        class="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-md opacity-0 group-hover/slider:opacity-100 transition duration-200 z-20">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button @click.prevent="activeSlide = activeSlide === slides - 1 ? 0 : activeSlide + 1" 
                                        class="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-md opacity-0 group-hover/slider:opacity-100 transition duration-200 z-20">
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
                            
                            <div class="absolute top-2 right-2 {{ $product->stok_barang > 0 ? 'bg-green-500' : 'bg-red-500' }} text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-30">
                                Stok: {{ $product->stok_barang }}
                            </div>
                        </div>

                        <div class="p-4 flex flex-col flex-1">
                            <h3 class="font-bold text-gray-800 text-sm mb-1 line-clamp-2" title="{{ $product->nama_barang }}">
                                {{ $product->nama_barang }}
                            </h3>
                            <p class="text-indigo-600 font-extrabold text-lg mt-auto mb-2">
                                Rp {{ number_format($product->harga_barang, 0, ',', '.') }}
                            </p>
                            
                            <div class="pt-3 border-t border-gray-100 mt-2 flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    @if($product->penjual_photo)
                                        <img src="{{ asset('storage/' . $product->penjual_photo) }}" class="w-full h-full object-cover">
                                    @else
                                        <div class="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                            {{ substr($product->penjual_name ?? '?', 0, 1) }}
                                        </div>
                                    @endif
                                </div>
                                <span class="text-xs text-gray-500 truncate" title="{{ $product->penjual_name ?? 'Anonim' }}">
                                    {{ $product->penjual_name ?? 'Penjual Anonim' }}
                                </span>
                            </div>
                        </div>

                    </div>
                @endforeach
            </div>
        @endif

    </div>

</body>
</html>