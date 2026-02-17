<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Admin - Pusat Pesan</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; } 
        .scrollbar-hide::-webkit-scrollbar { display: none; }
    </style>
</head>
<body class="bg-gray-100 font-sans h-screen flex flex-col">

    <nav class="bg-indigo-900 text-white p-4 shadow-lg flex-none">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold flex items-center gap-3">
                <div class="p-2 rounded-lg bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                Admin Chat Center
            </h1>
            <a href="{{ route('admin.dashboard') }}" class="bg-indigo-800 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-bold border border-indigo-700 transition">
                Kembali Dashboard
            </a>
        </div>
    </nav>

    <div class="container mx-auto mt-6 px-4 flex-1 flex overflow-hidden gap-4 pb-6 h-[85vh]" x-data="{ tab: '{{ request('type') == 'guest' ? 'guest' : 'member' }}' }">
    
        <div class="w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            
            <div class="flex border-b border-gray-200 bg-gray-50">
                <button @click="tab = 'member'" 
                        :class="tab === 'member' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'" 
                        class="flex-1 py-4 font-bold text-sm transition focus:outline-none">
                    Member ({{ $users->count() }})
                </button>
                <button @click="tab = 'guest'" 
                        :class="tab === 'guest' ? 'border-b-2 border-orange-500 text-orange-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'" 
                        class="flex-1 py-4 font-bold text-sm transition focus:outline-none">
                    Tamu ({{ isset($guests) ? $guests->count() : 0 }})
                </button>
            </div>

            <div class="flex-1 overflow-y-auto bg-white">
                
                <div x-show="tab === 'member'" class="divide-y divide-gray-100">
                    @forelse($users as $user)
                        <a href="?type=member&id={{ $user->id }}" class="block hover:bg-indigo-50 transition p-4 {{ request('type') != 'guest' && request('id') == $user->id ? 'bg-indigo-50 border-l-4 border-indigo-600' : '' }}">
                            <div class="flex items-center gap-3">
                                @if($user->profile_photo)
                                    <img src="{{ asset('storage/' . $user->profile_photo) }}" class="w-10 h-10 rounded-full object-cover border">
                                @else
                                    <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                                        {{ substr($user->name, 0, 2) }}
                                    </div>
                                @endif
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-bold text-gray-800 truncate text-sm">{{ $user->name }}</h4>
                                    <p class="text-xs text-gray-500 truncate">{{ $user->email }}</p>
                                </div>
                            </div>
                        </a>
                    @empty
                        <div class="p-8 text-center text-gray-400 text-sm">Belum ada member.</div>
                    @endforelse
                </div>

                <div x-show="tab === 'guest'" style="display: none;" class="divide-y divide-gray-100">
                    @if(isset($guests))
                        @forelse($guests as $guest)
                            <a href="?type=guest&id={{ $guest->session_id }}" class="block hover:bg-orange-50 transition p-4 {{ request('type') == 'guest' && request('id') == $guest->session_id ? 'bg-orange-50 border-l-4 border-orange-500' : '' }}">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                                        T
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-bold text-gray-800 truncate text-sm">Tamu #{{ substr($guest->session_id, -4) }}</h4>
                                        <p class="text-[10px] text-gray-400 truncate">ID: {{ $guest->session_id }}</p>
                                    </div>
                                    <div class="text-[10px] text-gray-400 text-right">
                                        {{ \Carbon\Carbon::parse($guest->last_chat)->format('d/m H:i') }}
                                    </div>
                                </div>
                            </a>
                        @empty
                            <div class="p-8 text-center text-gray-400 text-sm">Belum ada chat tamu.</div>
                        @endforelse
                    @endif
                </div>

            </div>
        </div>

        <div class="w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
            
            @if(isset($activeChat))
                <div class="p-4 border-b border-gray-100 flex items-center gap-4 shadow-sm z-10 bg-white">
                    <div class="w-10 h-10 rounded-full {{ request('type') == 'guest' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600' }} flex items-center justify-center font-bold border">
                        @if(request('type') != 'guest' && $activeChat->profile_photo)
                             <img src="{{ asset('storage/' . $activeChat->profile_photo) }}" class="w-full h-full rounded-full object-cover">
                        @else
                             {{ substr($activeChat->name, 0, 1) }}
                        @endif
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg">{{ $activeChat->name }}</h3>
                        <span class="text-xs font-medium {{ request('type') == 'guest' ? 'text-orange-500' : 'text-indigo-500' }} bg-gray-50 px-2 py-0.5 rounded">
                            {{ request('type') == 'guest' ? 'Mode Tamu' : 'Member Terdaftar' }}
                        </span>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50" id="chatContainer">
                    <div class="flex justify-center mt-10">
                        <span class="bg-white px-4 py-2 rounded-full shadow-sm text-sm text-gray-400 flex items-center gap-2 border">
                            <svg class="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Memuat percakapan...
                        </span>
                    </div>
                </div>

                <div class="p-4 border-t border-gray-100 bg-white">
                    <form id="replyForm" class="flex gap-3">
                        <input type="text" id="messageInput" autocomplete="off" placeholder="Ketik balasan..." 
                            class="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 {{ request('type') == 'guest' ? 'focus:ring-orange-500' : 'focus:ring-indigo-500' }} transition">
                        
                        <button type="submit" 
                            class="p-3.5 rounded-full text-white shadow-md hover:scale-105 transition transform {{ request('type') == 'guest' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700' }}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            @else
                <div class="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                    <div class="bg-white p-6 rounded-full shadow-sm mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-600">Admin Chat Center</h3>
                    <p class="text-sm mt-1">Pilih Member atau Tamu di sebelah kiri untuk memulai chat.</p>
                </div>
            @endif
        </div>
    </div>

    @if(isset($activeChat))
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Data dari PHP
            const chatType = "{{ request('type') }}"; // 'member' atau 'guest'
            const chatId = "{{ request('type') == 'guest' ? $activeChat->id : $activeChat->id }}"; // Guest ID string, Member ID int
            const adminId = "{{ Auth::id() }}";
            
            // Elemen DOM
            const chatContainer = document.getElementById('chatContainer');
            const replyForm = document.getElementById('replyForm');
            const messageInput = document.getElementById('messageInput');
            
            // --- TENTUKAN URL API BERDASARKAN TIPE ---
            const fetchUrl = chatType === 'guest' 
                ? `/api/admin/guest-chats/${chatId}/json`  // Route API Guest
                : `/admin/chats/${chatId}/json`;           // Route API Member

            const replyUrl = chatType === 'guest'
                ? `/api/admin/guest-chats/reply/${chatId}` // Route Reply Guest
                : `/admin/chats/reply/${chatId}`;          // Route Reply Member

            // --- FUNGSI LOAD PESAN ---
            async function fetchMessages() {
                try {
                    const res = await fetch(fetchUrl);
                    const json = await res.json();
                    
                    // Handle format data (Controller Guest pakai 'data', Member pakai root array)
                    const messages = json.data || json; 
                    renderMessages(messages);
                } catch (e) { console.error("Gagal fetch:", e); }
            }

            // --- FUNGSI RENDER KE HTML ---
            function renderMessages(messages) {
                let html = '';
                
                if(messages.length === 0) {
                    chatContainer.innerHTML = '<div class="flex justify-center mt-10"><span class="text-gray-400 text-sm">Belum ada riwayat pesan.</span></div>';
                    return;
                }

                messages.forEach(msg => {
                    // Logic "Apakah ini Saya (Admin)?"
                    let isMe = false;
                    if (chatType === 'guest') {
                        isMe = (msg.sender_type === 'admin'); // Di tabel guest_chats
                    } else {
                        isMe = (msg.sender_id == adminId);    // Di tabel chats
                    }

                    // Styling Bubble
                    const alignClass = isMe ? 'justify-end' : 'justify-start';
                    const bgClass = isMe 
                        ? (chatType === 'guest' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-indigo-600 text-white rounded-tr-none') 
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none';
                    
                    // Format Waktu
                    const date = new Date(msg.created_at);
                    const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    html += `
                        <div class="flex ${alignClass} mb-3 animate-fade-in-up">
                            <div class="max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm text-sm relative group ${bgClass}">
                                <p class="leading-relaxed whitespace-pre-wrap">${msg.message}</p>
                                <span class="text-[10px] block text-right mt-1 opacity-70">${time}</span>
                            </div>
                        </div>`;
                });
                
                // Cek scroll position sebelum update untuk UX yang baik
                const isScrolledBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 100;
                
                chatContainer.innerHTML = html;

                // Auto Scroll ke bawah jika user ada di bawah
                if (isScrolledBottom) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }

            // --- FUNGSI KIRIM (REPLY) ---
            replyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const text = messageInput.value;
                if(!text.trim()) return;

                // 1. Optimistic UI (Tampilkan langsung biar cepat)
                const tempColor = chatType === 'guest' ? 'bg-orange-500' : 'bg-indigo-600';
                const tempHtml = `
                    <div class="flex justify-end mb-3 opacity-50">
                        <div class="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm text-white rounded-tr-none ${tempColor}">
                            ${text} <span class="text-[10px] ml-1">...</span>
                        </div>
                    </div>`;
                chatContainer.insertAdjacentHTML('beforeend', tempHtml);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                messageInput.value = '';

                // 2. Kirim ke Server
                try {
                    await fetch(replyUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                        },
                        body: JSON.stringify({ message: text })
                    });
                    // 3. Refresh Data Asli
                    fetchMessages();
                } catch (error) { 
                    alert("Gagal mengirim pesan. Cek koneksi.");
                    console.error(error); 
                }
            });

            // Jalankan saat pertama load & set Interval polling
            fetchMessages().then(() => chatContainer.scrollTop = chatContainer.scrollHeight);
            setInterval(fetchMessages, 3000); // Update tiap 3 detik
        });
    </script>
    @endif

</body>
</html>