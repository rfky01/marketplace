<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ isset($activeSeller) && $activeSeller ? 'Produk ' . $activeSeller->name . ' - Admin' : (($activeCategory ?? null) ? 'Produk ' . ucfirst($activeCategory) . ' - Admin' : 'Semua Produk - Admin') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen pb-10">
    @php
        $fromCategories = request('from') === 'categories';
        $activeSeller = $activeSeller ?? null;
        $profileBackUrl = request('profile_back_url');
        $backUrl = $activeSeller
            ? route('admin.users.profile', array_filter([
                'id' => $activeSeller->id,
                'profile_back_url' => $profileBackUrl,
            ]))
            : ($fromCategories ? route('admin.categories.index') : route('admin.dashboard'));
        $resetParams = [];

        if ($fromCategories) {
            $resetParams['from'] = 'categories';
        }

        if ($activeSeller) {
            $resetParams['seller_id'] = $activeSeller->id;
        }

        if ($profileBackUrl) {
            $resetParams['profile_back_url'] = $profileBackUrl;
        }

        $resetUrl = route('admin.products', $resetParams);
    @endphp

    <nav class="bg-indigo-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a href="{{ $backUrl }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition text-sm font-semibold border border-transparent hover:border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali
                </a>
                <h1 class="text-xl font-bold border-l border-white/20 pl-4">
                    {{ $activeSeller ? 'Produk ' . $activeSeller->name : (($activeCategory ?? null) ? 'Produk ' . ucfirst($activeCategory) : 'Semua Produk Marketplace') }}
                </h1>
            </div>
            <div class="text-sm font-medium bg-white/10 px-4 py-2 rounded-lg">
                Total: {{ $products->total() ?? 0 }} Produk
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8">
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

        @if(auth()->user()?->isSuperAdmin() && $activeSeller)
            <div class="mb-6 rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 class="text-lg font-extrabold text-gray-800">Override Upload Produk</h2>
                        <p class="text-sm text-gray-500">Produk akan tercatat sebagai milik {{ $activeSeller->name }}, tetapi dibuat oleh Super Admin.</p>
                    </div>
                    <span class="inline-flex w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">Wajib alasan</span>
                </div>

                <form method="POST" action="{{ route('admin.users.override-products', $activeSeller->id) }}" enctype="multipart/form-data" class="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    @csrf
                    @if($profileBackUrl)
                        <input type="hidden" name="profile_back_url" value="{{ $profileBackUrl }}">
                    @endif
                    <div class="lg:col-span-4">
                        <label class="mb-1 block text-xs font-bold uppercase text-gray-400">Nama Produk</label>
                        <input type="text" name="nama_barang" value="{{ old('nama_barang') }}" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required>
                    </div>
                    <div class="lg:col-span-2">
                        <label class="mb-1 block text-xs font-bold uppercase text-gray-400">Harga</label>
                        <input type="number" name="harga_barang" value="{{ old('harga_barang') }}" min="0" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required>
                    </div>
                    <div class="lg:col-span-2">
                        <label class="mb-1 block text-xs font-bold uppercase text-gray-400">Stok</label>
                        <input type="number" name="stok_barang" value="{{ old('stok_barang') }}" min="0" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required>
                    </div>
                    <div class="lg:col-span-4">
                        <label class="mb-1 block text-xs font-bold uppercase text-gray-400">Kategori Cadangan</label>
                        <select name="kategori" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required>
                            @foreach($categories ?? [] as $category)
                                <option value="{{ $category }}" {{ old('kategori') === $category ? 'selected' : '' }}>{{ ucfirst($category) }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="lg:col-span-6">
                        <label class="mb-1 block text-xs font-bold uppercase text-gray-400">Deskripsi</label>
                        <textarea name="deskripsi" rows="4" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required>{{ old('deskripsi') }}</textarea>
                    </div>
                    <div class="lg:col-span-6">
                        <label class="mb-1 block text-xs font-bold uppercase text-gray-400">Foto Produk</label>
                        <input type="file" name="foto_barang[]" accept="image/*" multiple class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required>
                        <label class="mb-1 mt-3 block text-xs font-bold uppercase text-gray-400">Alasan Override</label>
                        <textarea name="override_reason" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" placeholder="Contoh: Seller kesulitan upload foto produk dan meminta bantuan." required>{{ old('override_reason') }}</textarea>
                    </div>
                    <div class="lg:col-span-12 flex justify-end">
                        <button type="submit" class="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700" onclick="return confirm('Buat produk ini sebagai override Super Admin untuk seller?')">
                            Buat Produk Override
                        </button>
                    </div>
                </form>
            </div>
        @endif
        
        <div class="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <form method="GET" action="{{ route('admin.products') ?? url()->current() }}" class="flex flex-col md:flex-row justify-between items-center gap-4">
                @if($fromCategories)
                    <input type="hidden" name="from" value="categories">
                @endif
                @if($activeSeller)
                    <input type="hidden" name="seller_id" value="{{ $activeSeller->id }}">
                @endif
                @if($profileBackUrl)
                    <input type="hidden" name="profile_back_url" value="{{ $profileBackUrl }}">
                @endif
                
                <div class="w-full md:flex-1 relative flex items-center">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg class="w-5 h-5 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        name="search" 
                        value="{{ request('search') }}" 
                        class="block w-full pl-12 pr-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-inner" 
                        placeholder="{{ $activeSeller ? 'Cari produk milik ' . $activeSeller->name . '...' : 'Cari nama produk, kategori, atau nama penjual...' }}" 
                        onchange="this.form.submit()"
                    >
                </div>

                <div class="flex items-center gap-3 w-full md:w-auto">
                    <select name="category" onchange="this.form.submit()" class="bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-44 py-3 px-3 cursor-pointer shadow-sm transition outline-none hover:bg-gray-50">
                        <option value="">Semua Kategori</option>
                        @foreach($categories ?? [] as $category)
                            <option value="{{ $category }}" {{ ($activeCategory ?? request('category')) == $category ? 'selected' : '' }}>
                                {{ ucfirst($category) }}
                            </option>
                        @endforeach
                    </select>

                    <select name="sort" onchange="this.form.submit()" class="bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full md:w-40 py-3 px-3 cursor-pointer shadow-sm transition outline-none hover:bg-gray-50">
                        <option value="">Terbaru</option>
                        <option value="lowest" {{ request('sort') == 'lowest' ? 'selected' : '' }}>Harga Termurah</option>
                        <option value="highest" {{ request('sort') == 'highest' ? 'selected' : '' }}>Harga Termahal</option>
                    </select>

                    @if(request('search') || request('sort') || request('category'))
                        <a href="{{ $resetUrl }}" class="flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-lg transition border border-red-100 shadow-sm whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reset
                        </a>
                    @endif
                </div>

            </form>
        </div>
        
        @if($products->isEmpty())
            <div class="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center mt-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 class="text-lg font-bold text-gray-700">Belum Ada Produk</h3>
                <p class="text-gray-500 text-sm mt-1">
                    {!! request('search') || request('category') ? 'Tidak ada produk yang cocok dengan filter Anda.' : 'Saat ini belum ada penjual yang mengunggah produk.' !!}
                </p>
            </div>
        @else
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                @foreach($products as $product)
                    
                    @php
                        // FOTO BARANG
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

                        $fotos = array_map(function($f) {
                            return str_replace('public/', '', $f);
                        }, $fotos);
                        
                        if (empty($fotos)) $fotos = [null]; 

                        // RATING OTOMATIS DARI ELOQUENT
                        $jumlahUlasan = $product->ulasan ? $product->ulasan->count() : 0; 
                        $rataRata = $jumlahUlasan > 0 ? number_format($product->ulasan->avg('rating'), 1) : '0.0';
                        $isOverride = $product->is_super_admin_override;
                        $overrideAdminName = $product->override_admin_name ?? 'Super Admin';
                    @endphp

                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col group relative">
                        
                        <a href="{{ route('admin.products.show', $product->id) }}" class="block relative">
                            <div x-data="{ activeSlide: 0, slides: {{ count($fotos) }} }" class="aspect-square bg-gray-100 relative overflow-hidden group/slider">
                                @if($isOverride)
                                    <div class="absolute left-2 top-2 z-30 inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-600/95 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm" title="Dibuat oleh {{ $overrideAdminName }} sebagai override Super Admin">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.75a.75.75 0 00-1.5 0v3.19L7.47 8.16a.75.75 0 00-1.06 1.06l3.06 3.06a.75.75 0 001.06 0l3.06-3.06a.75.75 0 10-1.06-1.06l-1.78 1.78V6.75z" clip-rule="evenodd" />
                                        </svg>
                                        Override
                                    </div>
                                @endif
                                
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

                                @if($product->stok_barang <= 0)
                                    <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                                        <span class="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">HABIS</span>
                                    </div>
                                @endif

                                @if(count($fotos) > 1)
                                    <button @click.prevent="activeSlide = activeSlide === 0 ? slides - 1 : activeSlide - 1" 
                                            class="absolute left-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-md opacity-0 group-hover/slider:opacity-100 transition duration-200 z-20">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>

                                    <button @click.prevent="activeSlide = activeSlide === slides - 1 ? 0 : activeSlide + 1" 
                                            class="absolute right-1 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 shadow-md opacity-0 group-hover/slider:opacity-100 transition duration-200 z-20">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>

                                    <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
                                        <template x-for="i in slides">
                                            <div class="w-1.5 h-1.5 rounded-full transition-colors duration-200 shadow-sm"
                                                 :class="activeSlide === i - 1 ? 'bg-white' : 'bg-white/50'"></div>
                                        </template>
                                    </div>
                                @endif
                            </div>
                        </a>

                        <div class="p-3 flex flex-col flex-1">
                            
                            <a href="{{ route('admin.products.show', $product->id) }}" class="block">
                                <h3 class="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug hover:text-indigo-600 transition min-h-[40px]" title="{{ $product->nama_barang }}">
                                    {{ $product->nama_barang }}
                                </h3>
                            </a>

                            <div class="mb-1 pointer-events-none">
                                <span class="text-gray-800 font-bold text-base">
                                    Rp {{ number_format($product->harga_barang, 0, ',', '.') }}
                                </span>
                            </div>

                            <p class="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-3 pointer-events-none">
                                {{ $product->kategori }}
                            </p>

                            @if($isOverride)
                                <div class="mb-3 rounded-lg border border-red-100 bg-red-50 px-2 py-1.5 text-[10px] font-semibold text-red-700 pointer-events-none">
                                    Dibuat oleh {{ $overrideAdminName }} sebagai override
                                </div>
                            @endif
                            
                            <div class="flex items-center gap-1 mb-2 pointer-events-none">
                                <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span class="text-xs font-bold text-gray-600">{{ $rataRata }}</span>
                                <span class="text-[10px] text-gray-400">({{ $jumlahUlasan }})</span>
                            </div>

                            <div class="pt-3 border-t border-gray-100 mt-auto flex items-center justify-between gap-2">
                                
                                <a href="{{ route('admin.users.profile', $product->user_id) }}" class="flex items-center gap-2 overflow-hidden hover:opacity-75 transition group/profil" title="Lihat profil: {{ $product->user->name ?? 'Anonim' }}">
                                    <div class="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 group-hover/profil:ring-2 ring-indigo-400 transition">
                                        @if($product->user && $product->user->profile_photo)
                                            <img src="{{ asset('storage/' . $product->user->profile_photo) }}" class="w-full h-full object-cover">
                                        @else
                                            <div class="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                                {{ substr($product->user->name ?? '?', 0, 1) }}
                                            </div>
                                        @endif
                                    </div>
                                    <span class="text-xs font-medium text-gray-500 truncate group-hover/profil:text-indigo-600 transition">
                                        {{ explode(' ', $product->user->name ?? 'Penjual')[0] }}
                                    </span>
                                </a>
                                <span class="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold flex-shrink-0 pointer-events-none">
                                    Stok {{ $product->stok_barang }}
                                </span>
                            </div>

                        </div>

                    </div>
                @endforeach
            </div>

            @if($products->hasPages())
            <div class="mt-12 flex justify-center pb-4">
                <div class="flex items-center gap-4 text-sm font-medium bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-200">
                    
                    @if (!$products->onFirstPage())
                        <a href="{{ $products->previousPageUrl() }}" class="text-indigo-600 hover:text-indigo-800 transition font-bold">« Sebelumnya</a>
                    @endif

                    <div class="flex items-center gap-2">
                        @foreach(range(1, $products->lastPage()) as $i)
                            @if($i >= $products->currentPage() - 2 && $i <= $products->currentPage() + 2)
                                @if($i == $products->currentPage())
                                    <span class="text-white font-bold text-sm bg-indigo-600 w-8 h-8 flex items-center justify-center rounded-full shadow-md">{{ $i }}</span>
                                @else
                                    <a href="{{ $products->url($i) }}" class="text-gray-500 hover:text-indigo-600 font-bold transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-50 border border-transparent">{{ $i }}</a>
                                @endif
                            @endif
                        @endforeach
                    </div>

                    @if ($products->hasMorePages())
                        <a href="{{ $products->nextPageUrl() }}" class="text-indigo-600 hover:text-indigo-800 transition font-bold">Berikutnya »</a>
                    @endif
                    
                </div>
            </div>
            @endif

        @endif

    </div>

</body>
</html>
