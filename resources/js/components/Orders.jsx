import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});
    
    // --- STATE NAVBAR ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- STATE MODAL RATING ---
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (userData) setUser(JSON.parse(userData));

        fetchOrders();

        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (id) => {
        if(!confirm("Yakin ingin membatalkan pesanan ini?")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/orders/${id}/cancel`, {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert("Pesanan berhasil dibatalkan");
                fetchOrders();
            } else {
                alert("Gagal membatalkan pesanan");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteHistory = async (id) => {
        if(!confirm("Hapus riwayat pesanan ini? Data akan hilang permanen.")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/orders/${id}`, { 
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                alert("Riwayat pesanan dihapus.");
                setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
            } else {
                alert("Gagal menghapus riwayat.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan sistem.");
        }
    };

    // --- HANDLER RATING (DIPERBAIKI) ---
    const openRatingModal = (order) => {
        setSelectedOrder(order);
        setRating(0);
        setReviewText('');
        setIsRatingModalOpen(true);
    };

    const handleSubmitRating = async () => {
        if (rating === 0) {
            alert("Mohon berikan bintang penilaian.");
            return;
        }

        // --- PERBAIKAN LOGIKA DISINI ---
        // Karena Backend mewajibkan 'produk_id', kita ambil produk pertama dari pesanan ini
        const targetProductId = selectedOrder.detail_pesanan && selectedOrder.detail_pesanan.length > 0 
            ? selectedOrder.detail_pesanan[0].produk_id 
            : null;

        if (!targetProductId) {
            alert("Data produk tidak ditemukan dalam pesanan ini.");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/reviews', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' // Penting: Agar error backend terbaca sebagai JSON
                },
                // --- SESUAIKAN BODY DENGAN POSTMAN ---
                body: JSON.stringify({
                    pesanan_id: selectedOrder.id,
                    produk_id: targetProductId, // Backend WAJIB butuh ini
                    rating: rating,
                    comment: reviewText // Backend WAJIB butuh 'comment', bukan 'comment'
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Ulasan berhasil dikirim! Terima kasih.");
                setIsRatingModalOpen(false);
            } else {
                // Tampilkan pesan error detail dari backend jika ada
                alert("Gagal: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan koneksi atau server error.");
        }
    };
    // ----------------------------------

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatRupiah = (num) => {
        const n = Number(num);
        if (isNaN(n)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(n);
    };
    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 w-full font-sans pb-20">
            
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight decoration-none">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/keranjang" className="text-2xl text-gray-500 hover:text-blue-900">🛒</Link>
                        <Link to="/" className="hidden md:inline-flex items-center text-gray-500 hover:text-blue-600 font-medium transition no-underline text-sm border-r border-gray-300 pr-6">
                            <span className="mr-1 text-lg"></span>Dashboard
                        </Link>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">{user.name?.charAt(0).toUpperCase()}</div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs text-gray-500">Halo,</p>
                                    <p className="text-sm font-bold text-gray-800 max-w-[100px] truncate">{user.name}</p>
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-50">
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-md text-sm font-bold">🚪 Keluar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center gap-3 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Riwayat Pesanan</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
                        <div className="text-6xl mb-4">📭</div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada pesanan</h2>
                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg no-underline">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">No. Invoice</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-800 font-mono">{order.invoice_code || `INV-${order.id}`}</p>
                                            <span className="text-gray-300">|</span>
                                            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide 
                                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                          order.status === 'selesai' ? 'bg-green-100 text-green-700' : 
                                          order.status === 'dikirim' ? 'bg-purple-100 text-purple-700' :
                                          'bg-red-100 text-red-700'}`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="p-4">
                                    {order.detail_pesanan?.map((detail, index) => (
                                        <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
                                            <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                                                <img 
                                                    src={detail.produk?.foto_barang} 
                                                    alt={detail.produk?.nama_barang} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{detail.produk?.nama_barang || 'Produk dihapus'}</h4>
                                                <p className="text-xs text-gray-500">{detail.jumlah} barang x {formatRupiah(detail.produk?.harga_barang || 0)}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-gray-800 text-sm">{formatRupiah((detail.produk?.harga_barang || 0) * detail.jumlah)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-500">Total Tagihan:</p>
                                        <p className="text-lg font-bold text-blue-600">{formatRupiah(order.grand_total)}</p>
                                    </div>
                                    
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {order.status.toLowerCase().includes('dibatalkan') || order.status.toLowerCase().includes('cancel') ? (
                                            <button 
                                                onClick={() => handleDeleteHistory(order.id)}
                                                className="w-full sm:w-auto px-4 py-1.5 bg-red-50 text-gray-600 border border-red-200 rounded-md text-xs font-bold hover:bg-red-100 transition"
                                            >
                                                Hapus Riwayat
                                            </button>
                                        ) : null}

                                        {order.status === 'pending' ? (
                                            <button 
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="w-full sm:w-auto px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-bold hover:bg-red-100 transition"
                                            >
                                                Batalkan Pesanan
                                            </button>
                                        ) : null}

                                        {order.status === 'selesai' && (
                                            <button 
                                                onClick={() => openRatingModal(order)}
                                                className="w-full sm:w-auto px-4 py-1.5 bg-yellow-400 text-white border border-yellow-500 rounded-md text-xs font-bold hover:bg-yellow-500 transition shadow-sm flex items-center justify-center gap-1"
                                            >
                                                ★ Beri Ulasan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODAL POPUP RATING --- */}
            {isRatingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Beri Ulasan Produk</h3>
                            <button onClick={() => setIsRatingModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-4xl transition transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-sm text-gray-500 mb-4 font-medium">
                                {rating === 0 ? "Ketuk bintang untuk menilai" : 
                                 rating === 5 ? "Sempurna! 😍" : 
                                 rating === 4 ? "Puas! 😄" : 
                                 rating === 3 ? "Cukup Bagus 🙂" : 
                                 rating === 2 ? "Kurang 😐" : "Kecewa 😞"}
                            </p>

                            <textarea 
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none"
                                placeholder="Bagaimana kualitas produk ini? Ceritakan pengalamanmu..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                            ></textarea>

                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm">Batal</button>
                                <button onClick={handleSubmitRating} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg text-sm">Kirim Ulasan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}