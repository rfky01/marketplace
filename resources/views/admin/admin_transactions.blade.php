<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Semua Transaksi - Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
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
                <h1 class="text-xl font-bold border-l border-white/20 pl-4">Semua Transaksi Marketplace</h1>
            </div>
            <div class="text-sm font-medium bg-white/10 px-4 py-2 rounded-lg" id="badge-nav">
                Total: {{ count($transactions) }} Transaksi
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8">
        <div class="flex flex-col lg:flex-row gap-6 items-start">
            
            <div class="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 z-30">
                <div class="flex items-center justify-between mb-4 px-1">
                    <h1 class="text-2xl font-bold text-gray-800">Filter Status</h1>
                    <span class="lg:hidden bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold">{{ $totalSemua ?? 0 }}</span>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="p-4 border-b border-gray-100 bg-gray-50 hidden lg:flex justify-between items-center">
                        <h3 class="font-bold text-gray-700 text-sm">Status Pesanan</h3>
                        <span class="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold" id="badge-side">{{ $totalSemua ?? 0 }}</span>
                    </div>
                    
                    <div class="hidden lg:flex flex-col p-2">
                        @php
                            $menus = [
                                'semua' => 'Semua',
                                'pending' => 'Pannding',
                                'dikemas' => 'Accepted',
                                'dikirim' => 'Dikirim',
                                'selesai' => 'Selesai',
                                'return' => 'Komplain / Return',
                                'batal' => 'Dibatalkan'
                            ];
                        @endphp
                        @foreach($menus as $key => $label)
                            <a href="{{ route('admin.transactions', ['status' => $key, 'search' => request('search')]) }}" 
                               class="w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all mb-1 flex justify-between items-center {{ ($activeStatus ?? 'semua') == $key ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700' }}">
                                {{ $label }}
                                @if(($activeStatus ?? 'semua') == $key)
                                    <span class="text-indigo-500">•</span>
                                @endif
                            </a>
                        @endforeach
                    </div>

                    <div class="lg:hidden flex overflow-x-auto no-scrollbar p-2 gap-2 border-b border-gray-100">
                        @foreach($menus as $key => $label)
                            <a href="{{ route('admin.transactions', ['status' => $key, 'search' => request('search')]) }}" 
                               class="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap border transition-all {{ ($activeStatus ?? 'semua') == $key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200' }}">
                                {{ $label }}
                            </a>
                        @endforeach
                    </div>
                </div>
            </div>

            <div class="flex-1 w-full min-w-0">
                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    <div class="p-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Riwayat Transaksi
                        </h2>

                        <form method="GET" action="{{ route('admin.transactions') }}" class="w-full md:w-80 relative">
                            <input type="hidden" name="status" value="{{ $activeStatus ?? 'semua' }}">
                            
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg class="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                </svg>
                            </div>
                            
                            <input 
                                type="text" 
                                name="search" 
                                id="input-pencarian"
                                value="{{ request('search') }}" 
                                class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" 
                                placeholder="Cari No. Invoice (INV-...)" 
                                onchange="this.form.submit()"
                            >
                        </form>
                    </div>

                    <div id="data-transaksi">
                        <div class="overflow-y-auto max-h-[calc(100vh-16rem)]">
                            <div class="md:hidden divide-y divide-gray-100 bg-white">
                                @forelse($transactions as $mobileTrx)
                                    @php
                                        $fotoMobileArray = json_decode($mobileTrx->foto_barang, true);
                                        $fotoMobileUtama = (is_array($fotoMobileArray) && count($fotoMobileArray) > 0) ? $fotoMobileArray[0] : null;
                                        $mobileStatusClass = 'bg-gray-100 text-gray-600 border-gray-200';
                                        $mobileStatusText = strtoupper($mobileTrx->status);

                                        if(in_array(strtolower($mobileTrx->status), ['pending', 'panding'])) $mobileStatusClass = 'bg-yellow-50 text-yellow-600 border-yellow-200';
                                        elseif(in_array(strtolower($mobileTrx->status), ['diproses', 'dibayar', 'dikemas', 'accepted', 'proses'])) $mobileStatusClass = 'bg-blue-50 text-blue-600 border-blue-200';
                                        elseif(strtolower($mobileTrx->status) == 'dikirim') $mobileStatusClass = 'bg-purple-50 text-purple-600 border-purple-200';
                                        elseif(strtolower($mobileTrx->status) == 'selesai') $mobileStatusClass = 'bg-green-50 text-green-600 border-green-200';
                                        elseif(str_contains(strtolower($mobileTrx->status), 'return')) $mobileStatusClass = 'bg-orange-50 text-orange-600 border-orange-200';
                                        elseif(in_array(strtolower($mobileTrx->status), ['batal', 'dibatalkan', 'canceled', 'canceled by seller', 'canceled by buyer', 'ditolak'])) $mobileStatusClass = 'bg-red-50 text-red-600 border-red-200';
                                    @endphp

                                    <div class="p-4">
                                        <div class="flex items-start justify-between gap-3">
                                            <div class="min-w-0">
                                                <p class="font-bold text-indigo-700 truncate">{{ $mobileTrx->invoice_id }}</p>
                                                <p class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($mobileTrx->tanggal)->format('d M Y, H:i') }}</p>
                                            </div>
                                            <span class="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider border {{ $mobileStatusClass }}">
                                                {{ str_contains(strtolower($mobileTrx->status), 'return') ? 'RETURN' : $mobileStatusText }}
                                            </span>
                                        </div>

                                        <div class="mt-4 flex items-center gap-3">
                                            <div class="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                @if($fotoMobileUtama)
                                                    <img src="{{ asset('storage/' . $fotoMobileUtama) }}" class="w-full h-full object-cover">
                                                @else
                                                    <div class="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Img</div>
                                                @endif
                                            </div>
                                            <div class="min-w-0">
                                                <p class="font-semibold text-gray-800 line-clamp-2">{{ $mobileTrx->nama_barang }}</p>
                                                <p class="text-xs text-gray-500 mt-0.5">{{ $mobileTrx->jumlah }} Pcs</p>
                                            </div>
                                        </div>

                                        <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
                                            <div class="rounded-lg bg-blue-50 border border-blue-100 p-3">
                                                <p class="text-blue-500 font-bold uppercase tracking-wide">Pembeli</p>
                                                <p class="mt-1 font-bold text-blue-700 truncate">{{ $mobileTrx->nama_pembeli }}</p>
                                            </div>
                                            <div class="rounded-lg bg-purple-50 border border-purple-100 p-3">
                                                <p class="text-purple-500 font-bold uppercase tracking-wide">Penjual</p>
                                                <p class="mt-1 font-bold text-purple-700 truncate">{{ $mobileTrx->nama_penjual }}</p>
                                            </div>
                                        </div>

                                        <div class="mt-3 rounded-lg bg-green-50 border border-green-100 p-3">
                                            <p class="text-xs font-bold uppercase tracking-wide text-green-500">Total Harga</p>
                                            <p class="mt-1 font-extrabold text-green-700">Rp {{ number_format($mobileTrx->total_harga, 0, ',', '.') }}</p>
                                        </div>
                                    </div>
                                @empty
                                    <div class="p-10 text-center text-gray-500 font-medium">
                                        Belum ada transaksi dengan filter tersebut.
                                    </div>
                                @endforelse
                            </div>

                            <div class="hidden md:block overflow-x-auto">
                            <table class="min-w-[960px] w-full text-left border-collapse relative">
                                
                                <thead class="sticky top-0 z-20 shadow-sm">
                                    <tr class="text-gray-500 text-xs uppercase tracking-wider">
                                        <th class="p-4 font-bold border-b border-gray-200 bg-gray-100">Order ID & Waktu</th>
                                        <th class="p-4 font-bold border-b border-gray-200 bg-gray-100">Produk</th>
                                        <th class="p-4 font-bold border-b border-gray-200 bg-gray-100">Pembeli</th>
                                        <th class="p-4 font-bold border-b border-gray-200 bg-gray-100">Penjual (Toko)</th>
                                        <th class="p-4 font-bold border-b border-gray-200 bg-gray-100">Total Harga</th>
                                        <th class="p-4 font-bold border-b border-gray-200 bg-gray-100 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="text-sm divide-y divide-gray-100">
                                    @forelse($transactions as $trx)
                                        <tr class="hover:bg-gray-50 transition-colors">
                                            
                                            <td class="p-4 align-middle">
                                                <p class="font-bold text-indigo-700 mb-1">{{ $trx->invoice_id }}</p>
                                                <p class="text-xs text-gray-500">{{ \Carbon\Carbon::parse($trx->tanggal)->format('d M Y, H:i') }}</p>
                                            </td>

                                            <td class="p-4 align-middle max-w-[250px]">
                                                <div class="flex items-center gap-3">
                                                    @php
                                                        $fotoArray = json_decode($trx->foto_barang, true);
                                                        $fotoUtama = (is_array($fotoArray) && count($fotoArray) > 0) ? $fotoArray[0] : null;
                                                    @endphp
                                                    
                                                    <div class="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                        @if($fotoUtama)
                                                            <img src="{{ asset('storage/' . $fotoUtama) }}" class="w-full h-full object-cover">
                                                        @else
                                                            <div class="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No Img</div>
                                                        @endif
                                                    </div>
                                                    <div>
                                                        <p class="font-semibold text-gray-800 line-clamp-2" title="{{ $trx->nama_barang }}">{{ $trx->nama_barang }}</p>
                                                        <p class="text-xs text-gray-500 mt-0.5">{{ $trx->jumlah }} Pcs</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td class="p-4 align-middle">
                                                <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold text-xs border border-blue-100">
                                                    {{ $trx->nama_pembeli }}
                                                </span>
                                            </td>

                                            <td class="p-4 align-middle">
                                                <span class="bg-purple-50 text-purple-700 px-2 py-1 rounded font-semibold text-xs border border-purple-100">
                                                    {{ $trx->nama_penjual }}
                                                </span>
                                            </td>

                                            <td class="p-4 align-middle">
                                                <p class="font-extrabold text-green-600">Rp {{ number_format($trx->total_harga, 0, ',', '.') }}</p>
                                            </td>

                                            <td class="p-4 align-middle text-center">
                                                @php
                                                    $statusClass = 'bg-gray-100 text-gray-600 border-gray-200';
                                                    $statusText = strtoupper($trx->status);
                                                    
                                                    if(in_array(strtolower($trx->status), ['pending', 'panding'])) $statusClass = 'bg-yellow-50 text-yellow-600 border-yellow-200';
                                                    elseif(in_array(strtolower($trx->status), ['diproses', 'dibayar', 'dikemas', 'accepted', 'proses'])) $statusClass = 'bg-blue-50 text-blue-600 border-blue-200';
                                                    elseif(strtolower($trx->status) == 'dikirim') $statusClass = 'bg-purple-50 text-purple-600 border-purple-200';
                                                    elseif(strtolower($trx->status) == 'selesai') $statusClass = 'bg-green-50 text-green-600 border-green-200';
                                                    elseif(str_contains(strtolower($trx->status), 'return')) $statusClass = 'bg-orange-50 text-orange-600 border-orange-200';
                                                    elseif(in_array(strtolower($trx->status), ['batal', 'dibatalkan', 'canceled', 'canceled by seller', 'canceled by buyer', 'ditolak'])) $statusClass = 'bg-red-50 text-red-600 border-red-200';
                                                @endphp
                                                <span class="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider border {{ $statusClass }}">
                                                    {{ str_contains(strtolower($trx->status), 'return') ? 'RETURN' : $statusText }}
                                                </span>
                                            </td>
                                        </tr>
                                    @empty
                                        <tr>
                                            <td colspan="6" class="p-10 text-center text-gray-500 font-medium">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                Belum ada transaksi dengan filter tersebut.
                                            </td>
                                        </tr>
                                    @endforelse
                                </tbody>
                            </table>
                            </div>
                        </div>

                        @if($transactions->hasPages())
                        <div class="p-6 border-t border-gray-100 bg-white flex justify-center rounded-b-2xl">
                            <div class="flex items-center gap-4 text-sm font-medium">
                                
                                {{-- Tombol Sebelumnya --}}
                                @if (!$transactions->onFirstPage())
                                    <a href="{{ $transactions->previousPageUrl() }}" class="text-indigo-600 hover:text-indigo-800 transition">« Sebelumnya</a>
                                @endif

                                {{-- Angka Halaman --}}
                                <div class="flex items-center gap-4">
                                    @foreach(range(1, $transactions->lastPage()) as $i)
                                        {{-- Hanya tampilkan maksimal 2 halaman di kiri/kanan halaman aktif agar rapi --}}
                                        @if($i >= $transactions->currentPage() - 2 && $i <= $transactions->currentPage() + 2)
                                            @if($i == $transactions->currentPage())
                                                <span class="text-gray-800 font-bold text-base">{{ $i }}</span>
                                            @else
                                                <a href="{{ $transactions->url($i) }}" class="text-indigo-600 hover:text-indigo-800 transition">{{ $i }}</a>
                                            @endif
                                        @endif
                                    @endforeach
                                </div>

                                {{-- Tombol Berikutnya --}}
                                @if ($transactions->hasMorePages())
                                    <a href="{{ $transactions->nextPageUrl() }}" class="text-indigo-600 hover:text-indigo-800 transition">Berikutnya »</a>
                                @endif
                            </div>
                        </div>
                        @endif
                    </div> </div>
            </div>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            let isUserTyping = false;
            const searchInput = document.getElementById('input-pencarian');

            // 1. Jangan update data jika Admin sedang mengetik di kotak pencarian
            if(searchInput) {
                searchInput.addEventListener('focus', () => isUserTyping = true);
                searchInput.addEventListener('blur', () => isUserTyping = false);
            }

            // 2. Tarik data baru dari server setiap 5 detik
            setInterval(() => {
                if (!isUserTyping) {
                    fetch(window.location.href)
                        .then(response => response.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const newDoc = parser.parseFromString(html, 'text/html');
                            
                            const oldTable = document.getElementById('data-transaksi');
                            const newTable = newDoc.getElementById('data-transaksi');
                            
                            if(oldTable && newTable) {
                                // PERBAIKAN: 1. Catat posisi scroll tabel saat ini sebelum diganti
                                const scrollContainer = oldTable.querySelector('.overflow-y-auto');
                                const currentScrollPos = scrollContainer ? scrollContainer.scrollTop : 0;

                                // 2. Ganti isi HTML tabel
                                oldTable.innerHTML = newTable.innerHTML;

                                // PERBAIKAN: 3. Kembalikan posisi scroll ke tempat semula
                                const newScrollContainer = oldTable.querySelector('.overflow-y-auto');
                                if (newScrollContainer) {
                                    newScrollContainer.scrollTop = currentScrollPos;
                                }
                            }

                            // Ganti Total Transaksi di Navigasi Atas
                            const oldNav = document.getElementById('badge-nav');
                            const newNav = newDoc.getElementById('badge-nav');
                            if(oldNav && newNav) oldNav.innerHTML = newNav.innerHTML;

                            // Ganti Total Transaksi di Sidebar
                            const oldSide = document.getElementById('badge-side');
                            const newSide = newDoc.getElementById('badge-side');
                            if(oldSide && newSide) oldSide.innerHTML = newSide.innerHTML;
                        })
                        .catch(err => console.error('Gagal mengambil data real-time:', err));
                }
            }, 5000); // 5000ms = 5 detik
        });
    </script>
</body>
</html>
