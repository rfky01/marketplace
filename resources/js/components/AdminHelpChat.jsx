import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

export default function AdminHelpChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // --- PENTING: Ganti angka 1 ini dengan ID Admin di database Anda ---
    const ADMIN_ID = 3; 
    
    // Ambil Token User
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    const isLoggedIn = token && user;

    // --- GENERATE ID UNIK UNTUK TAMU ---
    const getGuestSessionId = () => {
        let sessionId = localStorage.getItem('guest_session_id');
        if (!sessionId) {
            // Buat ID acak, contoh: guest_k9s8d7f_1708234
            sessionId = 'guest_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('guest_session_id', sessionId);
        }
        return sessionId;
    };

    // Ambil ID Tamu jika tidak login
    const guestSessionId = !isLoggedIn ? getGuestSessionId() : null;

    // 1. Fungsi Ambil Pesan (Load Chat)
    const fetchMessages = async () => {
        try {
            let url = '';
            let headers = { 'Content-Type': 'application/json' };

            if (isLoggedIn) {
                // MODE 1: MEMBER LOGIN (Pakai Tabel 'chats')
                url = `http://127.0.0.1:8000/api/chat/${ADMIN_ID}`;
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                // MODE 2: TAMU (Pakai Tabel 'guest_chats')
                url = `http://127.0.0.1:8000/api/guest-chat/${guestSessionId}`;
            }

            const response = await fetch(url, { headers });
            const data = await response.json();
            
            if (response.ok) {
                // Pastikan format data konsisten
                setMessages(data.data || data);
            }
        } catch (error) {
            console.error("Gagal load chat:", error);
        }
    };

    // 2. Fungsi Kirim Pesan
    // 2. Fungsi Kirim Pesan (REVISI)
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            let url = '';
            let body = {};
            let headers = { 'Content-Type': 'application/json' };

            if (isLoggedIn) {
                // KIRIM SEBAGAI MEMBER
                url = 'http://127.0.0.1:8000/api/chat/send';
                headers['Authorization'] = `Bearer ${token}`;
                body = { receiver_id: ADMIN_ID, message: newMessage };
            } else {
                // KIRIM SEBAGAI TAMU
                url = 'http://127.0.0.1:8000/api/guest-chat/send';
                body = { session_id: guestSessionId, message: newMessage };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setNewMessage('');
                setShowEmoji(false);
                fetchMessages(); // Refresh chat langsung
            }
        } catch (error) {
            console.error("Gagal kirim:", error);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
        // Jangan tutup picker agar user bisa nambah banyak emoji sekaligus
    };

    // Auto scroll ke bawah saat ada pesan baru
    useEffect(() => {
        if(isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, showEmoji]);

    // Polling: Cek pesan baru setiap 5 detik saat chat dibuka
    useEffect(() => {
        let interval;
        if (isOpen) {
            fetchMessages();
            interval = setInterval(fetchMessages, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            
            {/* --- JENDELA CHAT (Hanya muncul jika isOpen = true) --- */}
            {isOpen && (
                <div className="bg-white w-80 h-[420px] rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden animate-fade-in-up relative">
                    
                    {/* Header Chat */}
                    <div className={`${isLoggedIn ? 'bg-indigo-600' : 'bg-orange-500'} p-4 text-white flex justify-between items-center shadow-md transition-colors duration-500`}>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                                    CS
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">{isLoggedIn ? 'Admin Support' : 'Layanan Tamu'}</h3>
                                <p className="text-[10px] opacity-90">{isLoggedIn ? 'Member Area' : 'Konsultasi Login'}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                            ✕
                        </button>
                    </div>

                    {/* Isi Chat */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                        {messages.length === 0 ? (
                            <p className="text-center text-gray-400 text-xs mt-10">
                                Halo! Ada yang bisa kami bantu?
                            </p>
                        ) : (
                            messages.map((msg, index) => {
                                // LOGIC POSISI CHAT (Kanan = Saya, Kiri = Admin)
                                let isMe = false;
                                
                                if (isLoggedIn) {
                                    // Jika Member: Cek sender_id vs user.id
                                    isMe = (msg.sender_id === user?.id);
                                } else {
                                    // Jika Tamu: Cek sender_type == 'guest'
                                    isMe = (msg.sender_type === 'guest');
                                }

                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                            isMe
                                            ? (isLoggedIn ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-orange-500 text-white rounded-br-none') 
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                        }`}>
                                            {msg.message || msg.content}
                                            <p className={`text-[9px] mt-1 text-right opacity-70`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {showEmoji && (
                        <div className="absolute bottom-[70px] left-2 right-2 z-40 animate-fade-in-up">
                            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                                {/* Header Kecil Emoji untuk Tutup */}
                                <div className="bg-gray-100 px-3 py-2 flex justify-between items-center border-b border-gray-200">
                                    <span className="text-xs font-bold text-gray-500">Pilih Emoji</span>
                                    <button 
                                        onClick={() => setShowEmoji(false)} 
                                        className="text-gray-400 hover:text-red-500 transition"
                                        title="Tutup Emoji"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Library Emoji */}
                                <EmojiPicker 
                                    onEmojiClick={onEmojiClick} 
                                    width="100%" 
                                    height="250px" // Tinggi pas agar tidak menutupi seluruh chat
                                    searchDisabled={true} 
                                    skinTonesDisabled={true}
                                    previewConfig={{ showPreview: false }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Input Kirim */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">

                        <button 
                            type="button"
                            onClick={() => setShowEmoji(!showEmoji)}
                            className={`transition p-2 rounded-full ${showEmoji ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'}`}
                            title="Buka Emoji"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                            </svg>
                        </button>

                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Tulis kendala..." 
                            className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                            onClick={() => setShowEmoji(false)}
                        />
                        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {/* --- TOMBOL FLOATING (Lingkaran Kuning di Gambar Anda) --- */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center relative group
                    ${isOpen ? 'bg-gray-500 rotate-90' : (isLoggedIn ? 'bg-indigo-600' : 'bg-orange-500')}
                `}
            >

                <div className="text-white">
                {isOpen ? (
                    // Ikon Close (X)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    // Ikon Chat Bubble
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                )}
                </div>
            </button>
        </div>
    );
}