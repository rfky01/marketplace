import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react'; // <--- IMPORT LIBRARY EMOJI

export default function ChatBox({ isOpen, onClose, receiverId, receiverName }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false); // <--- STATE UTK EMOJI
    const messagesEndRef = useRef(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

    // Scroll otomatis ke bawah
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && receiverId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, receiverId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/chat/${receiverId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (error) {
            console.error("Gagal ambil pesan", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiver_id: receiverId,
                    message: newMessage
                })
            });

            if (response.ok) {
                setNewMessage('');
                setShowEmoji(false); // Tutup emoji setelah kirim
                fetchMessages(); 
            }
        } catch (error) {
            console.error("Gagal kirim pesan", error);
        }
    };

    // Fungsi saat emoji diklik
    const onEmojiClick = (emojiObject) => {
        setNewMessage((prevInput) => prevInput + emojiObject.emoji);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {receiverName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">{receiverName}</h3>
                            <p className="text-[10px] opacity-80">Online</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-blue-700 w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
                </div>

                {/* Area Pesan */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3" onClick={() => setShowEmoji(false)}>
                    {messages.length === 0 ? (
                        <p className="text-center text-gray-400 text-xs mt-10">Belum ada percakapan. Sapa dia! 👋</p>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id === user.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] px-4 py-2 rounded-xl text-sm shadow-sm ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                    }`}>
                                        <p>{msg.message}</p>
                                        <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end relative">
                    
                    {/* POPUP EMOJI */}
                    {showEmoji && (
                        <div className="absolute bottom-16 left-0 sm:left-4 z-50 animate-fade-in-up">
                            <EmojiPicker 
                                onEmojiClick={onEmojiClick} 
                                width={300} 
                                height={350} 
                                previewConfig={{ showPreview: false }} 
                            />
                        </div>
                    )}

                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-full pl-4 pr-10 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Tulis pesan..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onFocus={() => setShowEmoji(false)} // Tutup emoji pas ngetik manual
                        />
                        
                        {/* TOMBOL EMOJI (DI DALAM INPUT) */}
                        <button 
                            type="button"
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition text-xl"
                        >
                            😊
                        </button>
                    </div>

                    <button type="submit" className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 shadow-lg transition transform active:scale-90 flex-shrink-0">
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
}