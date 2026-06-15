import React, { useState, useEffect, useRef } from 'react';
import ChatBox from './ChatBox';
import iconPesanan from './asset/pesan.png';

export default function ChatDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const dropdownRef = useRef(null);

    // Fetch Daftar Percakapan
    const fetchConversations = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setConversations(data.data);
            }
        } catch (error) {
            console.error("Gagal memuat chat", error);
        }
    };

    // Auto Refresh Inbox setiap 5 detik (Agar notifikasi realtime)
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    // Toggle Dropdown
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) fetchConversations();
    };

    // Klik di luar untuk tutup
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // SAAT KLIK SALAH SATU CHAT:
    const handleChatClick = async (user) => {
        setSelectedChat({ id: user.id, name: user.name });
        setIsOpen(false); 

        // 1. Update UI Lokal (langsung hilangkan badge biar responsif)
        setConversations(prev => prev.map(c => 
            c.id === user.id ? { ...c, unread_count: 0 } : c
        ));

        // 2. Panggil API 'Mark as Read' ke Backend
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://127.0.0.1:8000/api/chat/read/${user.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchConversations(); // Refresh lagi untuk memastikan
        } catch (error) {
            console.error(error);
        }
    };

    // Hitung Total Notifikasi untuk Badge Utama
    const totalUnread = conversations.reduce((sum, user) => sum + (user.unread_count || 0), 0);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* --- TOMBOL UTAMA --- */}
            <button
                onClick={toggleDropdown} 
                className="relative p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
                title="Pesan Masuk"
            >
                <img 
                    src={iconPesanan} 
                    alt="Chat" 
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain opacity-60 group-hover:opacity-100 transition duration-200"
                />
                
                {/* Badge Merah Utama (Muncul jika ada pesan belum dibaca) */}
                {totalUnread > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full border-2 border-white">
                        {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                )}
            </button>

            {/* --- DROPDOWN LIST --- */}
            {isOpen && (
                <div className="fixed left-3 right-3 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-down">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Pesan Masuk</h3>
                        <span className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={fetchConversations}>Refresh</span>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                Belum ada percakapan.
                            </div>
                        ) : (
                            conversations.map((user) => (
                                <div 
                                    key={user.id} 
                                    onClick={() => handleChatClick(user)}
                                    className={`px-4 py-3 cursor-pointer border-b border-gray-50 flex items-center gap-3 transition 
                                        ${user.unread_count > 0 ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Titik Hijau Online (Hiasan) */}
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className={`text-sm truncate ${user.unread_count > 0 ? 'font-extrabold text-black' : 'font-bold text-gray-700'}`}>
                                                {user.name}
                                            </h4>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(user.last_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs truncate max-w-[180px] ${user.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                                {user.last_message}
                                            </p>
                                            
                                            {/* Badge Merah Per User */}
                                            {user.unread_count > 0 && (
                                                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {user.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <ChatBox 
                isOpen={!!selectedChat} 
                onClose={() => {
                    setSelectedChat(null);
                    fetchConversations(); // Update inbox saat chat ditutup
                }}
                receiverId={selectedChat?.id} 
                receiverName={selectedChat?.name} 
            />
        </div>
    );
}
