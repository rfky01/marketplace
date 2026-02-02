<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Pesanan - {{ $user->name }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen pb-20">

    <nav class="bg-indigo-900 text-white p-4 shadow-lg sticky top-0 z-50 h-16 flex items-center">
        <div class="container mx-auto flex items-center gap-4">
            <a href="{{ route('admin.users.shop', $user->id) }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition">
                ⬅ Kembali ke Toko
            </a>
            <h1 class="text-xl font-bold border-l border-indigo-700 pl-4 ml-2">Riwayat Pesanan: {{ $user->name }}</h1>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8 max-w-6xl">
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            
            <div class="px-6 py-5 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 class="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span>📄</span> Daftar Transaksi
                </h3>

                <div class="flex items-center gap-3">
                    <form method="GET" action="{{ route('admin.users.shop.orders', $user->id) }}">
                        <select name="status" onchange="this.form.submit()" class="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 cursor-pointer shadow-sm">
                            <option value="">Semua Status</option>
                            <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                            <option value="dikirim" {{ request('status') == 'dikirim' ? 'selected' : '' }}>Dikirim</option>
                            <option value="selesai" {{ request('status') == 'selesai' ? 'selected' : '' }}>Selesai</option>
                            <option value="batal" {{ request('status') == 'batal' ? 'selected' : '' }}>Batal</option>
                        </select>
                    </form>

                    <span class="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg border border-purple-200">
                        Total: {{ count($riwayatPesanan) }}
                    </span>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-white text-gray-500 text-xs uppercase border-b border-gray-100 tracking-wider">
                            <th class="px-6 py-4 font-bold">Tanggal</th>
                            <th class="px-6 py-4 font-bold">Produk</th>
                            <th class="px-6 py-4 font-bold">Pembeli</th>
                            <th class="px-6 py-4 text-center font-bold">Jumlah</th>
                            <th class="px-6 py-4 font-bold">Total Harga</th>
                            <th class="px-6 py-4 text-center font-bold">Status</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-gray-100">
                        @forelse($riwayatPesanan as $order)
                            @php
                                $foto = $order->foto_barang;
                                if (is_string($foto)) {
                                    $decoded = json_decode($foto, true);
                                    if (is_array($decoded) && count($decoded) > 0) $foto = $decoded[0];
                                } elseif (is_array($foto)) {
                                    $foto = $foto[0];
                                }
                                $foto = str_replace('public/', '', $foto);
                            @endphp

                            <tr class="hover:bg-gray-50 transition duration-150">
                                <td class="px-6 py-4 text-gray-500 whitespace-nowrap">
                                    <div class="font-medium text-gray-700">{{ \Carbon\Carbon::parse($order->tanggal)->format('d M Y') }}</div>
                                    <div class="text-xs text-gray-400 mt-0.5">{{ \Carbon\Carbon::parse($order->tanggal)->format('H:i') }} WIB</div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                            @if($foto)
                                                <img src="{{ asset('storage/' . $foto) }}" class="w-full h-full object-cover">
                                            @else
                                                <div class="flex items-center justify-center h-full text-gray-300 text-xs">No img</div>
                                            @endif
                                        </div>
                                        <span class="font-bold text-gray-700 line-clamp-2 max-w-[180px]" title="{{ $order->nama_barang }}">
                                            {{ $order->nama_barang }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                            @if($order->foto_pembeli)
                                                <img src="{{ asset('storage/' . $order->foto_pembeli) }}" class="w-full h-full object-cover">
                                            @else
                                                <div class="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {{ substr($order->pembeli, 0, 1) }}
                                                </div>
                                            @endif
                                        </div>
                                        <span class="text-gray-600 font-medium text-sm">{{ $order->pembeli }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center font-bold text-gray-700">
                                    {{ $order->jumlah }}
                                </td>
                                <td class="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">
                                    Rp {{ number_format($order->total_harga, 0, ',', '.') }}
                                </td>
                                <td class="px-6 py-4 text-center">
                                    @if($order->status == 'selesai')
                                        <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Selesai</span>
                                    @elseif($order->status == 'dikirim')
                                        <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Dikirim</span>
                                    @elseif($order->status == 'batal')
                                        <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Batal</span>
                                    @else
                                        <span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">{{ ucfirst($order->status) }}</span>
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="px-6 py-16 text-center">
                                    <div class="flex flex-col items-center justify-center opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p class="text-gray-500 font-medium">
                                            @if(request('status'))
                                                Tidak ada pesanan dengan status "{{ ucfirst(request('status')) }}".
                                            @else
                                                Belum ada riwayat pesanan di toko ini.
                                            @endif
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</body>
</html>