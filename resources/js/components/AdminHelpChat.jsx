import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminHelpChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // --- PENTING: Ganti angka 1 ini dengan ID Admin di database Anda ---
    const ADMIN_ID = 1; 
    
    // Ambil Token User
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // 1. Fungsi Ambil Pesan (Load Chat)
    const fetchMessages = async () => {
        if (!token) return;
        try {
            // Sesuaikan URL ini dengan endpoint API chat Anda yang sudah ada
            // Biasanya: /api/chat/{receiver_id}
            const response = await fetch(`http://127.0.0.1:8000/api/chat/${ADMIN_ID}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setMessages(data.data || data); // Sesuaikan dengan struktur respon JSON Anda
            }
        } catch (error) {
            console.error("Gagal ambil chat:", error);
        }
    };

    // 2. Fungsi Kirim Pesan
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/chat/send', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiver_id: ADMIN_ID, // Kirim ke Admin
                    message: newMessage    // Sesuaikan nama kolom (message/content)
                })
            });

            if (response.ok) {
                setNewMessage('');
                fetchMessages(); // Refresh chat setelah kirim
            }
        } catch (error) {
            console.error("Gagal kirim:", error);
        }
    };

    // Auto scroll ke bawah saat ada pesan baru
    useEffect(() => {
        if(isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    // Polling: Cek pesan baru setiap 5 detik saat chat dibuka
    useEffect(() => {
        let interval;
        if (isOpen) {
            fetchMessages();
            interval = setInterval(fetchMessages, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    // Jika user belum login, jangan tampilkan apa-apa
    if (!token) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            
            {/* --- JENDELA CHAT (Hanya muncul jika isOpen = true) --- */}
            {isOpen && (
                <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
                    
                    {/* Header Chat */}
                    <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <h3 className="font-bold text-sm">Customer Service</h3>
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
                            messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm ${
                                        msg.sender_id === user.id 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border rounded-bl-none'
                                    }`}>
                                        {msg.message || msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Kirim */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Tulis kendala..." 
                            className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className={`${isOpen ? 'bg-gray-500 rotate-90' : 'bg-indigo-600'} text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center`}
            >
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
            </button>
        </div>
    );
}