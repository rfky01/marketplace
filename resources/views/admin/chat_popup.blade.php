<script type="module" src="https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js"></script>

<div id="admin-chat-popup" class="fixed bottom-0 right-6 w-80 bg-white shadow-[0_-5px_25px_rgba(0,0,0,0.15)] rounded-t-2xl z-[9999] flex flex-col border border-gray-200 font-sans transition-transform duration-300 transform translate-y-full opacity-0" style="height: 450px;">
    
    <div class="bg-indigo-600 text-white px-4 py-3 rounded-t-2xl flex justify-between items-center shadow-sm cursor-pointer" onclick="closeAdminChat()">
        <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-white relative overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div>
                <h4 id="popup-chat-name" class="font-bold text-sm tracking-wide line-clamp-1 max-w-[150px]">Nama User</h4>
                <p id="popup-chat-status" class="text-[10px] text-indigo-200 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Menghubungkan...
                </p>
            </div>
        </div>
        <button type="button" class="text-white hover:text-red-300 transition p-1 rounded-full hover:bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>

    <div id="popup-chat-messages" class="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-2 relative">
        <div class="flex h-full items-center justify-center text-xs text-gray-400">Memuat obrolan...</div>
    </div>

    <div class="relative bg-white border-t border-gray-100">
        <div id="emoji-picker-container" class="absolute bottom-full left-0 mb-1 hidden z-50 w-full px-2">
            <emoji-picker class="light" style="--num-columns: 7; --emoji-size: 1.3rem; width: 100%; height: 280px; border-radius: 0.75rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;"></emoji-picker>
        </div>

        <form onsubmit="sendPopupMsg(event)" class="p-2.5 flex items-center gap-2">
            <button type="button" id="emoji-btn" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition flex-shrink-0" title="Sisipkan Emoji">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            <input type="text" id="popup-chat-input" class="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-full px-4 py-2 text-sm outline-none transition" placeholder="Tulis pesan..." autocomplete="off">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white w-9 h-9 rounded-full flex items-center justify-center transition shadow-md flex-shrink-0 disabled:opacity-50" id="btn-send-chat">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform rotate-45 -mt-0.5 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
        </form>
    </div>
</div>

<script>
    let popupChatInterval;
    let activePopupUserId = null;
    const myAdminId = {{ auth()->id() ?? 0 }};

    document.addEventListener('DOMContentLoaded', () => {
        const emojiBtn = document.getElementById('emoji-btn');
        const emojiPickerContainer = document.getElementById('emoji-picker-container');
        const chatInput = document.getElementById('popup-chat-input');

        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPickerContainer.classList.toggle('hidden');
        });

        document.querySelector('emoji-picker').addEventListener('emoji-click', event => {
            chatInput.value += event.detail.unicode;
            chatInput.focus();
        });

        document.addEventListener('click', (e) => {
            if (!emojiPickerContainer.contains(e.target) && !emojiBtn.contains(e.target)) {
                emojiPickerContainer.classList.add('hidden');
            }
        });
    });

    function openAdminChat(userId, userName) {
        activePopupUserId = userId;
        document.getElementById('popup-chat-name').innerText = userName;
        document.getElementById('popup-chat-status').innerHTML = '<span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Menghubungkan...';
        document.getElementById('popup-chat-messages').innerHTML = '<div class="flex h-full items-center justify-center text-xs text-gray-400">Memuat obrolan...</div>';
        
        const popup = document.getElementById('admin-chat-popup');
        popup.classList.remove('hidden');
        setTimeout(() => popup.classList.remove('translate-y-full', 'opacity-0'), 10);

        loadPopupMessages();
        clearInterval(popupChatInterval);
        popupChatInterval = setInterval(loadPopupMessages, 3000);
    }

    function closeAdminChat() {
        const popup = document.getElementById('admin-chat-popup');
        const emojiPickerContainer = document.getElementById('emoji-picker-container');
        
        emojiPickerContainer.classList.add('hidden');
        popup.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => popup.classList.add('hidden'), 300);
        
        clearInterval(popupChatInterval);
        activePopupUserId = null;
    }

    function loadPopupMessages() {
        if(!activePopupUserId) return;
        
        fetch(`/admin/popup-chat/${activePopupUserId}`)
            .then(res => res.json())
            .then(data => {
                // 1. UPDATE STATUS ONLINE/OFFLINE DI HEADER
                const statusEl = document.getElementById('popup-chat-status');
                if (data.isOnline) {
                    statusEl.innerHTML = `<span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span> <span class="text-white font-medium">Online</span>`;
                } else {
                    statusEl.innerHTML = `<span class="w-1.5 h-1.5 bg-indigo-300 rounded-full"></span> <span class="text-indigo-200">${data.lastSeen}</span>`;
                }

                // 2. RENDER PESAN CHAT
                const box = document.getElementById('popup-chat-messages');
                const isScrolledToBottom = box.scrollHeight - box.clientHeight <= box.scrollTop + 30;
                let html = '';
                
                if(data.messages.length === 0) {
                    html = '<div class="text-center flex flex-col items-center justify-center h-full"><span class="text-3xl mb-2">👋</span><span class="text-xs text-gray-400">Belum ada obrolan. Mulai sapa sekarang!</span></div>';
                } else {
                    data.messages.forEach(m => {
                        let time = new Date(m.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                        if(m.sender_id == myAdminId) {
                            html += `
                                <div class="flex justify-end mb-1.5">
                                    <div class="bg-indigo-600 text-white text-[13px] py-2 px-3.5 rounded-l-2xl rounded-br-sm rounded-tr-2xl max-w-[85%] shadow-sm leading-relaxed relative group">
                                        ${m.message}
                                        <span class="block text-[9px] text-indigo-200 text-right mt-1">${time}</span>
                                    </div>
                                </div>`;
                        } else {
                            html += `
                                <div class="flex justify-start mb-1.5">
                                    <div class="bg-white text-gray-800 text-[13px] py-2 px-3.5 rounded-r-2xl rounded-bl-sm rounded-tl-2xl max-w-[85%] border border-gray-200 shadow-sm leading-relaxed relative group">
                                        ${m.message}
                                        <span class="block text-[9px] text-gray-400 text-left mt-1">${time}</span>
                                    </div>
                                </div>`;
                        }
                    });
                }
                
                box.innerHTML = html;
                if(isScrolledToBottom || html.includes('Belum ada obrolan')) {
                    box.scrollTop = box.scrollHeight;
                }
            });
    }

    function sendPopupMsg(e) {
        e.preventDefault();
        const input = document.getElementById('popup-chat-input');
        const btn = document.getElementById('btn-send-chat');
        const msg = input.value.trim();
        const emojiPickerContainer = document.getElementById('emoji-picker-container');

        if(!msg || !activePopupUserId) return;

        input.value = ''; 
        btn.disabled = true; 
        emojiPickerContainer.classList.add('hidden'); 

        fetch(`/admin/popup-chat/${activePopupUserId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify({ message: msg })
        })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            loadPopupMessages();
            setTimeout(() => {
                const box = document.getElementById('popup-chat-messages');
                box.scrollTop = box.scrollHeight;
            }, 100);
        })
        .catch(err => {
            btn.disabled = false;
        });
    }
</script>