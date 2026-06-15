<script type="module" src="https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js"></script>

<div id="center-chat-modal" class="fixed inset-0 z-[9999] bg-black/60 hidden flex items-center justify-center backdrop-blur-sm opacity-0 transition-opacity duration-300 p-3 sm:p-4">
    
    <div id="center-chat-box" class="bg-white w-full max-w-md h-[86vh] max-h-[550px] sm:h-[550px] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden transform scale-95 transition-transform duration-300 relative">
        
        <div class="bg-indigo-600 text-white px-4 sm:px-5 py-4 flex justify-between items-center gap-3 shadow-sm">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-white relative overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <div class="min-w-0">
                    <h4 id="center-chat-name" class="font-bold text-base tracking-wide line-clamp-1">Nama User</h4>
                    <p id="center-chat-status" class="text-xs text-indigo-200 flex items-center gap-1 mt-0.5">
                        <span class="w-2 h-2 bg-gray-400 rounded-full"></span> Menghubungkan...
                    </p>
                </div>
            </div>
            <button type="button" onclick="closeCenterChat()" class="text-white hover:text-red-300 transition p-1.5 rounded-full hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div id="center-chat-messages" class="flex-1 p-3 sm:p-5 overflow-y-auto bg-gray-50 flex flex-col gap-2 relative">
            <div class="flex h-full items-center justify-center text-sm text-gray-400">Memuat obrolan...</div>
        </div>

        <div class="relative bg-white border-t border-gray-100 p-3">
            
            <div id="emoji-picker-container-center" class="absolute bottom-full left-0 mb-2 hidden z-50 w-full px-2 sm:px-3">
                <emoji-picker class="light" style="--num-columns: 8; --emoji-size: 1.5rem; width: 100%; height: min(300px, 42vh); border-radius: 0.75rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;"></emoji-picker>
            </div>

            <form onsubmit="sendCenterMsg(event)" class="flex items-center gap-2">
                <button type="button" id="emoji-btn-center" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition flex-shrink-0" title="Sisipkan Emoji">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <input type="text" id="center-chat-input" class="min-w-0 flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-full px-4 py-2.5 text-sm outline-none transition" placeholder="Tulis pesan..." autocomplete="off">
                <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition shadow-md flex-shrink-0 disabled:opacity-50" id="btn-send-chat-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform rotate-45 -mt-0.5 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
    </div>
</div>

<script>
    let centerChatInterval;
    let activeCenterUserId = null;
    const myAdminIdCenter = {{ auth()->id() ?? 0 }};

    document.addEventListener('DOMContentLoaded', () => {
        const emojiBtn = document.getElementById('emoji-btn-center');
        const emojiPickerContainer = document.getElementById('emoji-picker-container-center');
        const chatInput = document.getElementById('center-chat-input');
        const modal = document.getElementById('center-chat-modal');
        const box = document.getElementById('center-chat-box');

        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiPickerContainer.classList.toggle('hidden');
        });

        const picker = document.querySelector('#emoji-picker-container-center emoji-picker');
        if(picker) {
            picker.addEventListener('emoji-click', event => {
                chatInput.value += event.detail.unicode;
                chatInput.focus();
            });
        }

        document.addEventListener('click', (e) => {
            if (!emojiPickerContainer.contains(e.target) && !emojiBtn.contains(e.target)) {
                emojiPickerContainer.classList.add('hidden');
            }
        });

        // Tutup modal jika klik area luar (hitam)
        modal.addEventListener('click', (e) => {
            if (!box.contains(e.target)) {
                closeCenterChat();
            }
        });
    });

    function openCenterChat(userId, userName) {
        activeCenterUserId = userId;
        document.getElementById('center-chat-name').innerText = userName;
        document.getElementById('center-chat-status').innerHTML = '<span class="w-2 h-2 bg-gray-400 rounded-full"></span> Menghubungkan...';
        document.getElementById('center-chat-messages').innerHTML = '<div class="flex h-full items-center justify-center text-sm text-gray-400">Memuat obrolan...</div>';
        
        const modal = document.getElementById('center-chat-modal');
        const box = document.getElementById('center-chat-box');
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            box.classList.remove('scale-95');
            box.classList.add('scale-100');
        }, 10);

        loadCenterMessages();
        clearInterval(centerChatInterval);
        centerChatInterval = setInterval(loadCenterMessages, 3000);
    }

    function closeCenterChat() {
        const modal = document.getElementById('center-chat-modal');
        const box = document.getElementById('center-chat-box');
        const emojiPickerContainer = document.getElementById('emoji-picker-container-center');
        
        emojiPickerContainer.classList.add('hidden');
        
        modal.classList.add('opacity-0');
        box.classList.remove('scale-100');
        box.classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
        
        clearInterval(centerChatInterval);
        activeCenterUserId = null;
    }

    function loadCenterMessages() {
        if(!activeCenterUserId) return;
        
        fetch(`/admin/popup-chat/${activeCenterUserId}`)
            .then(res => res.json())
            .then(data => {
                // UPDATE STATUS
                const statusEl = document.getElementById('center-chat-status');
                if (data.isOnline) {
                    statusEl.innerHTML = `<span class="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span> <span class="text-white font-medium">Online</span>`;
                } else {
                    statusEl.innerHTML = `<span class="w-2 h-2 bg-indigo-300 rounded-full"></span> <span class="text-indigo-200">${data.lastSeen}</span>`;
                }

                // RENDER PESAN
                const box = document.getElementById('center-chat-messages');
                const isScrolledToBottom = box.scrollHeight - box.clientHeight <= box.scrollTop + 30;
                let html = '';
                
                if(data.messages.length === 0) {
                    html = '<div class="text-center flex flex-col items-center justify-center h-full"><span class="text-4xl mb-3">👋</span><span class="text-sm text-gray-400">Belum ada obrolan. Mulai sapa sekarang!</span></div>';
                } else {
                    data.messages.forEach(m => {
                        let time = new Date(m.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                        if(m.sender_id == myAdminIdCenter) {
                            html += `
                                <div class="flex justify-end mb-2">
                                    <div class="bg-indigo-600 text-white text-sm py-2 px-4 rounded-l-2xl rounded-br-sm rounded-tr-2xl max-w-[85%] shadow-sm leading-relaxed relative group">
                                        ${m.message}
                                        <span class="block text-[10px] text-indigo-200 text-right mt-1">${time}</span>
                                    </div>
                                </div>`;
                        } else {
                            html += `
                                <div class="flex justify-start mb-2">
                                    <div class="bg-white text-gray-800 text-sm py-2 px-4 rounded-r-2xl rounded-bl-sm rounded-tl-2xl max-w-[85%] border border-gray-200 shadow-sm leading-relaxed relative group">
                                        ${m.message}
                                        <span class="block text-[10px] text-gray-400 text-left mt-1">${time}</span>
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

    function sendCenterMsg(e) {
        e.preventDefault();
        const input = document.getElementById('center-chat-input');
        const btn = document.getElementById('btn-send-chat-center');
        const msg = input.value.trim();
        const emojiPickerContainer = document.getElementById('emoji-picker-container-center');

        if(!msg || !activeCenterUserId) return;

        input.value = ''; 
        btn.disabled = true; 
        emojiPickerContainer.classList.add('hidden'); 

        fetch(`/admin/popup-chat/${activeCenterUserId}`, {
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
            loadCenterMessages();
            setTimeout(() => {
                const box = document.getElementById('center-chat-messages');
                box.scrollTop = box.scrollHeight;
            }, 100);
        })
        .catch(err => {
            btn.disabled = false;
        });
    }
</script>
