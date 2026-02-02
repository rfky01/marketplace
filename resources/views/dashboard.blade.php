<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 font-sans">

    <nav class="bg-blue-900 text-white p-4 shadow mb-6">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold">Admin Panel</h1>
            <form action="{{ route('logout') }}" method="POST">
                @csrf
                <button class="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-sm transition">Logout</button>
            </form>
        </div>
    </nav>

    <div class="container mx-auto px-4">
        <div class="bg-white rounded shadow p-6">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Daftar Pengguna</h2>
            
            @if(session('success'))
                <div class="bg-green-100 text-green-700 p-3 rounded mb-4">
                    {{ session('success') }}
                </div>
            @endif

            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-gray-200 text-left text-gray-600 text-sm uppercase">
                        <th class="p-3">Nama</th>
                        <th class="p-3">Email</th>
                        <th class="p-3">Status</th>
                        <th class="p-3 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="text-gray-700">
                    @foreach($users as $user)
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-3 font-medium">{{ $user->name }}</td>
                        <td class="p-3">{{ $user->email }}</td>
                        <td class="p-3">
                            {{-- LOGIKA BARU: Cek dari jumlah produk --}}
                            @if($user->products_count > 0)
                                <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                    Penjual ({{ $user->products_count }} Produk)
                                </span>
                            @else
                                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                                    Pembeli
                                </span>
                            @endif
                        </td>
                        <td class="p-3 text-center">
                            <form action="{{ route('admin.users.delete', $user->id) }}" method="POST" onsubmit="return confirm('Hapus user ini?');">
                                @csrf @method('DELETE')
                                <button class="text-red-500 hover:text-red-700 text-sm font-bold">Hapus</button>
                            </form>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            
            <div class="mt-4">
                {{ $users->links() }}
            </div>
        </div>
    </div>
</body>
</html>