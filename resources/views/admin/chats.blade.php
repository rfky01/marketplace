<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 font-sans h-screen flex flex-col">

    <nav class="bg-indigo-900 text-white p-4 shadow-lg flex-none">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold flex items-center gap-2">
                💬 Pusat Pesan
            </h1>
            <a href="{{ route('admin.dashboard') }}" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm font-bold transition">
                ⬅ Kembali ke Dashboard
            </a>
        </div>
    </nav>

    <div class="container mx-auto mt-6 px-4 flex-1 flex overflow-hidden gap-4 pb-6 h-[80vh]">
    
    <div class="w-1/3 bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
        <div class="p-4 border-b bg-gray-50 font-bold text-gray-700">
            Daftar Pesan Masuk
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
            @forelse($users as $user)
                <a href="{{ route('admin.chats', $user->id) }}" class="block">
                    <div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 {{ (isset($activeChat) && $activeChat->id == $user->id) ? 'bg-indigo-50 border-l-4 border-indigo-500' : '' }}">
                        <div class="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center font-bold text-indigo-700">
                            {{ substr($user->name, 0, 1) }}
                        </div>
                        <div>
                            <h4 class="font-bold text-sm text-gray-800">{{ $user->name }}</h4>
                            <p class="text-xs text-gray-500">{{ $user->email }}</p>
                        </div>
                    </div>
                </a>
            @empty
                <div class="p-4 text-center text-gray-400 text-sm">Belum ada pesan.</div>
            @endforelse
        </div>
    </div>

    <div class="w-2/3 bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
        @if(isset($activeChat))
            <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 class="font-bold text-lg">{{ $activeChat->name }}</h3>
            </div>

            <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50" id="chatContainer">
                @foreach($messages as $msg)
                    <div class="flex {{ $msg->sender_id == Auth::id() ? 'justify-end' : 'justify-start' }}">
                        <div class="max-w-xs px-4 py-2 rounded-lg shadow-sm {{ $msg->sender_id == Auth::id() ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none' }}">
                            <p class="text-sm">{{ $msg->message }}</p>
                            <span class="text-[10px] opacity-70 block text-right mt-1">
                                {{ $msg->created_at->format('H:i') }}
                            </span>
                        </div>
                    </div>
                @endforeach
            </div>

            <div class="p-4 border-t bg-white">
                <form action="{{ route('admin.chats.reply', $activeChat->id) }}" method="POST" class="flex gap-2">
                    @csrf
                    <input type="text" name="message" required placeholder="Tulis balasan..." class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold">
                        Kirim
                    </button>
                </form>
            </div>
        @else
            <div class="flex-1 flex items-center justify-center text-gray-400">
                <p>Pilih percakapan di sebelah kiri.</p>
            </div>
        @endif
    </div>
</div>

</body>
</html>