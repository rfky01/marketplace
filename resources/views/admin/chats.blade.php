<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.4/dist/index.min.js"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; } .emoji-picker {z-index: 9999 !important;} </style>
</head>
<body class="bg-gray-100 font-sans h-screen flex flex-col">

    <nav class="bg-indigo-900 text-white p-4 shadow-lg flex-none">
        <div class="container mx-auto flex justify-between items-center">
            
            <h1 class="text-xl font-bold flex items-center gap-3">
                <div class="p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                Pesan Masuk
            </h1>

            <a href="{{ route('admin.dashboard') }}" class="bg-indigo-800 hover:bg-indigo-700 border border-indigo-700 p-2.5 rounded-lg transition flex items-center justify-center" title="Kembali ke Dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </a>
        </div>
    </nav>

    <div class="container mx-auto mt-6 px-4 flex-1 flex overflow-hidden gap-4 pb-6 h-[80vh]">
    
        <div class="w-1/3 bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col overflow-hidden">
            <div class="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Daftar Pengguna
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                @forelse($users as $user)
                    <a href="{{ route('admin.chats', $user->id) }}" class="block">
                        <div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition {{ (isset($activeChat) && $activeChat->id == $user->id) ? 'bg-indigo-50 ring-1 ring-indigo-500' : 'hover:bg-gray-50' }}">
                            @if($user->profile_photo)
                                <img src="{{ asset('storage/' . $user->profile_photo) }}" class="w-10 h-10 rounded-full object-cover border border-gray-200">
                            @else
                                <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 border border-indigo-200">
                                    {{ substr($user->name, 0, 1) }}
                                </div>
                            @endif
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-sm text-gray-800 truncate">{{ $user->name }}</h4>
                                <p class="text-xs text-gray-500 truncate flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {{ $user->email }}
                                </p>
                            </div>
                            @if(isset($activeChat) && $activeChat->id == $user->id)
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                            @endif
                        </div>
                    </a>
                @empty
                    <div class="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p class="text-sm">Belum ada pesan.</p>
                    </div>
                @endforelse
            </div>
        </div>

        <div class="w-2/3 bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col overflow-hidden">
            @if(isset($activeChat))
                <div class="p-4 border-b border-gray-100 bg-white flex justify-between items-center shadow-sm z-10">
                    <div class="flex items-center gap-3">
                        @if($activeChat->profile_photo)
                            <img src="{{ asset('storage/' . $activeChat->profile_photo) }}" class="w-10 h-10 rounded-full object-cover border border-gray-200">
                        @else
                            <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                                {{ substr($activeChat->name, 0, 1) }}
                            </div>
                        @endif
                        <div>
                            <h3 class="font-bold text-lg text-gray-800 leading-tight">{{ $activeChat->name }}</h3>
                            <span class="text-xs text-green-600 font-bold flex items-center gap-1">
                                <span class="relative flex h-2 w-2">
                                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Online
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 scroll-smooth" id="chatContainer">
                    <div class="flex justify-center mt-10">
                        <span class="inline-flex items-center gap-2 text-gray-400 text-sm animate-pulse bg-white px-4 py-2 rounded-full shadow-sm">
                            <svg class="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memuat percakapan...
                        </span>
                    </div>
                </div>

                <div class="p-4 border-t border-gray-100 bg-white">
                    <form id="replyForm" class="flex gap-3 items-center">
                        <div class="flex-1 relative">
                            <input type="text" id="messageInput" required placeholder="Ketik pesan balasan..." class="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-gray-700">
                            
                            <button type="button" id="emojiTrigger" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition p-1 rounded-full hover:bg-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                        
                        <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center" title="Kirim Pesan">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            @else
                <div class="flex-1 flex items-center justify-center text-gray-400 flex-col bg-gray-50/30">
                    <div class="bg-gray-100 p-6 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                    </div>
                    <p class="font-medium text-gray-500">Pilih percakapan di sebelah kiri untuk mulai membalas.</p>
                </div>
            @endif
        </div>
    </div>

    @if(isset($activeChat))
    <script type="module">
        // 1. IMPORT LIBRARY LANGSUNG DARI CDN (Jauh lebih stabil)
        import { EmojiButton } from 'https://cdn.skypack.dev/@joeattardi/emoji-button';

        document.addEventListener('DOMContentLoaded', function() {
            const activeChatId = "{{ $activeChat->id }}";
            const adminId = "{{ Auth::id() }}";
            const chatContainer = document.getElementById('chatContainer');
            const replyForm = document.getElementById('replyForm');
            const messageInput = document.getElementById('messageInput');
            const emojiTrigger = document.getElementById('emojiTrigger');
            
            // --- 2. INISIALISASI EMOJI ---
            try {
                const picker = new EmojiButton({
                    position: 'top-end',
                    theme: 'light',
                    autoHide: false,
                    style: 'twemoji', // Menggunakan gaya emoji standar twitter (opsional)
                    zIndex: 9999
                });

                picker.on('emoji', selection => {
                    messageInput.value += selection.emoji;
                    messageInput.focus();
                });

                emojiTrigger.addEventListener('click', () => {
                    picker.togglePicker(emojiTrigger);
                });
                
            } catch (e) {
                console.error("Gagal memuat Emoji:", e);
                // Jangan pakai alert agar tidak mengganggu jika gagal
            }

            // --- 3. LOGIKA CHAT STANDAR ---
            let isFirstLoad = true;

            window.fetchMessages = async function() {
                try {
                    const response = await fetch(`/admin/chats/${activeChatId}/json`);
                    const result = await response.json();
                    
                    if (result.success) {
                        renderMessages(result.data);
                    }
                } catch (error) {
                    console.error("Gagal update chat:", error);
                }
            }

            function renderMessages(messages) {
                const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
                let html = '';
                messages.forEach(msg => {
                    const isMe = (msg.sender_id == adminId);
                    const date = new Date(msg.created_at);
                    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    html += `
                        <div class="flex ${isMe ? 'justify-end' : 'justify-start'} mb-1">
                            <div class="max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm relative group ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}">
                                <p class="text-sm leading-relaxed">${msg.message}</p>
                                <span class="text-[10px] block text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}">${time}</span>
                            </div>
                        </div>`;
                });
                chatContainer.innerHTML = html;
                if (isFirstLoad || isScrolledToBottom) {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    isFirstLoad = false;
                }
            }

            replyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const message = messageInput.value;
                if(!message.trim()) return;

                // Optimistic UI
                const tempHtml = `<div class="flex justify-end mb-1 opacity-70"><div class="max-w-[75%] px-4 py-2.5 rounded-2xl bg-indigo-600 text-white rounded-tr-none"><p class="text-sm">${message}</p></div></div>`;
                chatContainer.insertAdjacentHTML('beforeend', tempHtml);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                messageInput.value = '';

                try {
                    await fetch(`/admin/chats/reply/${activeChatId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                        },
                        body: JSON.stringify({ message: message })
                    });
                    fetchMessages();
                } catch (error) { console.error("Gagal kirim"); }
            });

            // Jalankan Interval
            fetchMessages();
            setInterval(fetchMessages, 3000);
        });
    </script>
    @endif

</body>
</html>