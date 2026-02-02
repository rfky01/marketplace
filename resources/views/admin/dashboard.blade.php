<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 font-sans">

    <nav class="bg-indigo-900 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold flex items-center gap-2">
                🛡️ Admin Panel
            </h1>
            
            <div class="flex items-center gap-4">
                <a href="{{ route('admin.chats') }}" class="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded text-sm font-bold transition">
                    💬 Chat
                </a>

                <form action="{{ route('logout') }}" method="POST">
                    @csrf
                    <button class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-bold transition">
                        Keluar
                    </button>
                </form>
            </div>
        </div>
    </nav>

    <div class="container mx-auto mt-8 px-4">
        <div class="bg-white rounded-xl shadow-md overflow-hidden p-6">
            
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                <h2 class="text-2xl font-bold text-gray-800">Daftar Pengguna</h2>
                
                <div class="flex bg-gray-100 p-1 rounded-lg">
                    <a href="{{ route('admin.dashboard') }}" 
                       class="px-4 py-2 rounded-md text-sm font-bold transition duration-200 
                       {{ $currentFilter == 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700' }}">
                        Semua
                    </a>

                    <a href="{{ route('admin.dashboard', ['filter' => 'penjual']) }}" 
                       class="px-4 py-2 rounded-md text-sm font-bold transition duration-200 flex items-center gap-2
                       {{ $currentFilter == 'penjual' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-500 hover:text-green-600' }}">
                        <span>🏪</span> Penjual
                    </a>

                    <a href="{{ route('admin.dashboard', ['filter' => 'pembeli']) }}" 
                       class="px-4 py-2 rounded-md text-sm font-bold transition duration-200 flex items-center gap-2
                       {{ $currentFilter == 'pembeli' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-blue-600' }}">
                        <span>🛒</span> Pembeli
                    </a>
                </div>
            </div>
            
            @if(session('success'))
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                    <p>{{ session('success') }}</p>
                </div>
            @endif

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                            <th class="py-3 px-6 text-left">Nama / Email</th>
                            <th class="py-3 px-6 text-center">Status</th>
                            <th class="py-3 px-6 text-center">Produk</th> 
                            <th class="py-3 px-6 text-center">Bergabung</th> 
                            <th class="py-3 px-6 text-center">Mulai Jualan</th> 
                            <th class="py-3 px-6 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="text-gray-600 text-sm font-light">
                        @foreach($users as $user)
                        <tr class="border-b border-gray-200 hover:bg-gray-50">
                            
                            <td class="py-3 px-6 text-left">
                                <a href="{{ route('admin.users.shop', $user->id) }}" class="flex items-center gap-3 group cursor-pointer p-2 rounded-lg transition hover:bg-gray-100 -ml-2">
                                    <div class="flex-shrink-0 w-10 h-10 group-hover:scale-105 transition duration-300">
                                        @if($user->profile_photo)
                                            <img class="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                                                 src="{{ asset('storage/' . $user->profile_photo) }}" alt="{{ $user->name }}">
                                        @else
                                            <img class="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                                                 src="https://ui-avatars.com/api/?name={{ urlencode($user->name) }}&background=random&color=fff&size=128" alt="{{ $user->name }}">
                                        @endif
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition">{{ $user->name }}</span>
                                        <span class="text-xs text-gray-500">{{ $user->email }}</span>
                                    </div>
                                </a>
                            </td>

                            <td class="py-3 px-6 text-center">
                                @if($user->products_count > 0)
                                    <span class="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-green-200 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                            <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
                                        </svg>
                                        Penjual
                                    </span>
                                @else
                                    <span class="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-blue-200 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                        </svg>
                                        Pembeli
                                    </span>
                                @endif
                            </td>

                            <td class="py-3 px-6 text-center">
                                @if($user->products_count > 0)
                                    <a href="{{ route('admin.users.shop', $user->id) }}" 
                                       class="bg-white text-gray-800 font-bold py-1 px-3 rounded-md text-xs border border-gray-300 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition duration-200 inline-flex items-center gap-1 group">
                                        
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-400 group-hover:text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                                            <path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd" />
                                        </svg>
                                        
                                        {{ $user->products_count }} Produk
                                    </a>
                                @else
                                    <span class="text-gray-300 text-xs italic">Kosong</span>
                                @endif
                            </td>

                            <td class="py-3 px-6 text-center">
                                <span class="bg-gray-100 text-gray-600 py-1 px-2 rounded text-xs font-medium border border-gray-200">
                                    📅 {{ $user->created_at->format('d M Y') }}
                                </span>
                            </td>

                            <td class="py-3 px-6 text-center">
                                @if($user->products_count > 0 && $user->products->count() > 0)
                                    <span class="text-green-600 font-bold text-xs flex items-center justify-center gap-1">
                                        🚀 {{ $user->products->sortBy('created_at')->first()->created_at->format('d M Y') }}
                                    </span>
                                @else
                                    <span class="text-gray-300">-</span>
                                @endif
                            </td>

                            <td class="py-3 px-6 text-center">
                                <div class="flex item-center justify-center gap-2">
                                    <a href="{{ route('admin.chats', $user->id) }}" 
                                       class="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-bold transition duration-200 border border-blue-200 flex items-center gap-1">
                                        💬 Chat
                                    </a>

                                    <form action="{{ route('admin.users.delete', $user->id) }}" method="POST" onsubmit="return confirm('Yakin ingin menghapus user ini?');">
                                        @csrf @method('DELETE')
                                        <button class="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-bold transition duration-200 border border-red-200">
                                            Hapus
                                        </button>
                                    </form>
                                </div>
                            </td>

                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            
            <div class="mt-6">
                {{ $users->links() }}
            </div>
        </div>
    </div>

</body>
</html>