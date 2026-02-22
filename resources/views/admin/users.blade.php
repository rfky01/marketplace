<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Pengguna</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen relative">

    <nav class="bg-indigo-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition text-sm font-semibold border border-transparent hover:border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Dashboard
                </a>
                <h1 class="text-xl font-bold border-l border-indigo-700 pl-4 ml-2 tracking-tight">Kelola Pengguna</h1>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8 pb-20">
        
        @if(session('success'))
            <div class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r shadow-sm flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="font-medium">{{ session('success') }}</p>
            </div>
        @endif
        
        @if(session('error'))
            <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r shadow-sm flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="font-medium">{{ session('error') }}</p>
            </div>
        @endif

        <div id="data-users" class="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            
            <div class="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                
                <h3 class="font-bold text-gray-800 text-lg flex items-center gap-2 whitespace-nowrap">
                    <div class="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    Daftar Semua Pengguna
                </h3>
                
                <form method="GET" action="{{ route('admin.users') }}" class="w-full lg:flex-1 lg:max-w-xl relative flex items-center gap-2">
                    @if(request('filter'))
                        <input type="hidden" name="filter" value="{{ request('filter') }}">
                    @endif
                    
                    <div class="relative flex-1">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            name="search" 
                            id="input-pencarian-user"
                            value="{{ request('search') }}" 
                            class="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition" 
                            placeholder="Cari nama atau email..." 
                            onchange="this.form.submit()"
                        >
                    </div>

                    <select name="activity" class="bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition cursor-pointer flex-shrink-0" onchange="this.form.submit()">
                        <option value="">Semua Status</option>
                        <option value="online" {{ request('activity') == 'online' ? 'selected' : '' }}>🟢 Online</option>
                        <option value="offline" {{ request('activity') == 'offline' ? 'selected' : '' }}>⚫ Offline</option>
                    </select>
                </form>

                <div class="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm whitespace-nowrap overflow-x-auto w-full lg:w-auto">
                    <a href="{{ route('admin.users', ['search' => request('search'), 'activity' => request('activity')]) }}" 
                       class="flex-1 lg:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition {{ $currentFilter == 'semua' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-gray-500 hover:bg-gray-50' }}">
                        Semua
                    </a>
                    
                    <a href="{{ route('admin.users', ['filter' => 'penjual', 'search' => request('search'), 'activity' => request('activity')]) }}" 
                       class="flex-1 lg:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition {{ $currentFilter == 'penjual' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50' }}">
                        Penjual
                    </a>

                    <a href="{{ route('admin.users', ['filter' => 'pembeli', 'search' => request('search'), 'activity' => request('activity')]) }}" 
                       class="flex-1 lg:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition {{ $currentFilter == 'pembeli' ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' : 'text-gray-500 hover:bg-gray-50' }}">
                        Pembeli
                    </a>
                </div>
            </div>

            <div class="overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)] table-container">
                <table class="w-full text-left border-collapse relative">
                    <thead class="sticky top-0 z-20 shadow-sm">
                        <tr class="text-gray-500 text-xs uppercase border-b border-gray-100 tracking-wider">
                            <th class="px-6 py-4 font-bold bg-white">Nama / Email</th>
                            <th class="px-6 py-4 font-bold text-center bg-white">Aktivitas</th>
                            <th class="px-6 py-4 font-bold text-center bg-white">Status (Role)</th>
                            <th class="px-6 py-4 font-bold text-center bg-white">Produk</th>
                            <th class="px-6 py-4 font-bold bg-white">Bergabung</th>
                            <th class="px-6 py-4 font-bold text-center bg-white">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-gray-50">
                        @forelse($users as $user)
                        <tr class="hover:bg-gray-50 transition duration-150 group">
                            
                            <td class="px-6 py-4">
                                <a href="{{ route('admin.users.shop', $user->id) }}" class="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-indigo-300 transition text-xs font-bold shadow-sm">
                                    @if($user->profile_photo)
                                        <img src="{{ asset('storage/' . $user->profile_photo) }}" class="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm">
                                    @else
                                        <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 border border-indigo-100">
                                            {{ substr($user->name, 0, 1) }}
                                        </div>
                                    @endif
                                    <div>
                                        <p class="font-bold text-gray-800">{{ $user->name }}</p>
                                        <p class="text-xs text-gray-500">{{ $user->email }}</p>
                                    </div>
                                </a>    
                            </td>

                            <td class="px-6 py-4 text-center">
                                @if($user->isOnline())
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shadow-sm" title="Sedang Online">
                                        <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                                    </span>
                                @else
                                    <div class="flex flex-col items-center justify-center">
                                        <span class="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200" title="Offline">
                                            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Offline
                                        </span>
                                        <span class="text-[9px] text-gray-400 mt-1.5 font-medium tracking-wide">
                                            {{ $user->getLastSeen() }}
                                        </span>
                                    </div>
                                @endif
                            </td>

                            <td class="px-6 py-4 text-center">
                                @if($user->role === 'admin')
                                    <span class="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-100">
                                        Administrator
                                    </span>
                                @elseif($user->products_count > 0)
                                    <span class="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                                        Penjual
                                    </span>
                                @else
                                    <span class="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                        Pembeli
                                    </span>
                                @endif
                            </td>

                            <td class="px-6 py-4 text-center">
                                @if($user->products_count > 0)
                                    <a href="{{ route('admin.users.shop', $user->id) }}" class="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-indigo-300 transition text-xs font-bold shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        {{ $user->products_count }} Produk
                                    </a>
                                @else
                                    <span class="text-gray-400 text-xs italic">Kosong</span>
                                @endif
                            </td>

                            <td class="px-6 py-4 text-gray-500 whitespace-nowrap text-xs font-medium">
                                <div class="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {{ $user->created_at->format('d M Y') }}
                                </div>
                            </td>

                            <td class="px-6 py-4 text-center">
                                @if($user->email === 'admin@marketplace.com')
                                    <span class="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-full border border-red-200 select-none cursor-not-allowed" title="Akun Utama Dilindungi">
                                        ADMIN
                                    </span>
                                @elseif(auth()->id() == $user->id)
                                    <span class="inline-flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 select-none cursor-not-allowed">
                                        Akun Anda
                                    </span>
                                @else
                                    <div class="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition duration-200">
                                        <button type="button" onclick="openAdminChat({{ $user->id }}, '{{ addslashes($user->name) }}')" class="flex items-center gap-1 bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-50 transition border border-gray-200 hover:border-indigo-200 shadow-sm" title="Chat User">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Chat
                                        </button>
                                        
                                        <form action="{{ route('admin.users.delete', $user->id) }}" method="POST" onsubmit="return confirm('Yakin ingin menghapus user ini? Semua produk dan data akan hilang.');">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="flex items-center gap-1 bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition border border-gray-200 hover:border-red-200 shadow-sm" title="Hapus User">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Hapus
                                            </button>
                                        </form>
                                    </div>
                                @endif
                            </td>

                        </tr>
                        @empty
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                                <div class="flex flex-col items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <p>Tidak ada data pengguna yang cocok dengan filter atau pencarian Anda.</p>
                                </div>
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @if($users->hasPages())
            <div class="p-6 border-t border-gray-100 bg-white flex justify-center">
                <div class="flex items-center gap-4 text-sm font-medium">
                    @if (!$users->onFirstPage())
                        <a href="{{ $users->previousPageUrl() }}" class="text-indigo-600 hover:text-indigo-800 transition">« Sebelumnya</a>
                    @endif

                    <div class="flex items-center gap-4">
                        @foreach(range(1, $users->lastPage()) as $i)
                            @if($i >= $users->currentPage() - 2 && $i <= $users->currentPage() + 2)
                                @if($i == $users->currentPage())
                                    <span class="text-gray-800 font-bold text-base">{{ $i }}</span>
                                @else
                                    <a href="{{ $users->url($i) }}" class="text-indigo-600 hover:text-indigo-800 transition">{{ $i }}</a>
                                @endif
                            @endif
                        @endforeach
                    </div>

                    @if ($users->hasMorePages())
                        <a href="{{ $users->nextPageUrl() }}" class="text-indigo-600 hover:text-indigo-800 transition">Berikutnya »</a>
                    @endif
                </div>
            </div>
            @endif

        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            let isUserTyping = false;
            const searchInput = document.getElementById('input-pencarian-user');

            if(searchInput) {
                searchInput.addEventListener('focus', () => isUserTyping = true);
                searchInput.addEventListener('blur', () => isUserTyping = false);
            }

            setInterval(() => {
                if (!isUserTyping) {
                    fetch(window.location.href)
                        .then(response => response.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const newDoc = parser.parseFromString(html, 'text/html');
                            
                            const oldContainer = document.getElementById('data-users');
                            const newContainer = newDoc.getElementById('data-users');
                            
                            if(oldContainer && newContainer) {
                                const scrollContainer = oldContainer.querySelector('.table-container');
                                const currentScrollPos = scrollContainer ? scrollContainer.scrollTop : 0;

                                oldContainer.innerHTML = newContainer.innerHTML;

                                const newScrollContainer = oldContainer.querySelector('.table-container');
                                if (newScrollContainer) {
                                    newScrollContainer.scrollTop = currentScrollPos;
                                }
                            }
                        })
                        .catch(err => console.error('Gagal mengambil data real-time:', err));
                }
            }, 5000); 
        });
    </script>
    
    @include('admin.popup.chat_popup')
</body>
</html>