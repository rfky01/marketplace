import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox'; 
import iconKeranjang from './asset/keranjang.png'
import iconBelumada from './asset/belumada.png'

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});

    const [activeTab, setActiveTab] = useState('all');
    
    // --- STATE NAVBAR ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- STATE MODAL RATING ---
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');

    // --- STATE CHAT ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState({ id: null, name: '' });

    // Fungsi Buka Chat dengan Penjual
    const openChat = (sellerId, sellerName) => {
        if (!sellerId) return alert("Data penjual tidak ditemukan");
        setChatTarget({ id: sellerId, name: sellerName || "Penjual" });
        setIsChatOpen(true);
    };
    
    const navigate = useNavigate();

    const tabs = [
        { id: 'all', label: 'Semua', statuses: [] },
        { id: 'pending', label: 'Menunggu Konfirmasi', statuses: ['pending'] },
        { id: 'proses', label: 'Diproses', statuses: ['accepted', 'proses', 'dikemas'] },
        { id: 'dikirim', label: 'Dikirim', statuses: ['dikirim'] },
        { id: 'selesai', label: 'Selesai', statuses: ['selesai'] },
        { id: 'return', label: 'Pengembalian', statuses: ['return_requested', 'return_accepted', 'return_rejected'] },
        { id: 'batal_pembeli', label: 'Dibatalkan Pembeli', statuses: ['canceled by buyer', 'canceled'] },
        { id: 'batal_penjual', label: 'Dibatalkan Penjual', statuses: ['canceled by seller', 'ditolak'] },    ];

    // --- STATE POPUP NOTIFIKASI ---
    const [customAlert, setCustomAlert] = useState({
        isOpen: false,
        message: '',
        type: 'success', 
        showCancel: false,
        confirmText: 'OK',
        cancelText: 'Batal',
        onConfirm: null
    });

    // --- EFFECT: AUTO-CLOSE UNTUK TOAST SUCCESS ---
    useEffect(() => {
        let timer;
        if (customAlert.isOpen && !customAlert.showCancel && customAlert.type === 'success') {
            timer = setTimeout(() => {
                setCustomAlert(prev => ({ ...prev, isOpen: false }));
            }, 3000); 
        }
        return () => clearTimeout(timer);
    }, [customAlert]);

    // --- EFFECT UTAMA: VALIDASI TOKEN & LOAD DATA ---
    useEffect(() => {
        // Ambil token langsung saat komponen di-mount
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        // 1. Cek Token di LocalStorage
        if (!token) {
            console.warn("Token tidak ditemukan di LocalStorage. Redirecting...");
            navigate('/login');
            return;
        }

        // 2. Load User Sementara
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }

        // 3. Validasi ke Server
        const validateAndFetch = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/user', {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json' // Header Wajib
                    }
                });

                // Cek apakah responnya HTML (Tanda Error 302/Redirect dari Backend)
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("text/html")) {
                    console.error("Server mengirim HTML, bukan JSON. Cek konfigurasi Backend.");
                    setLoading(false);
                    return; // Jangan logout, biarkan user tetap di halaman (mungkin error server sementara)
                }

                if (response.status === 401) {
                    console.warn("Token Kadaluarsa dari Server.");
                    // Hapus token dan logout HANYA jika benar-benar 401 JSON
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                    return;
                }

                const data = await response.json();
                
                if (response.ok) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    fetchOrders(); // Token valid, ambil order
                }
            } catch (error) {
                console.error("Network Error saat validasi:", error);
                setLoading(false); // Jangan logout jika internet mati
            }
        };

        validateAndFetch();

        // Listener dropdown (tetap sama)
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
        if (!token) return; // Cegah fetch tanpa token

        try {
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' // TAMBAHKAN INI
                }
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

    // --- FILTER LOGIC ---
    const filteredOrders = orders.filter(item => {
        if (activeTab === 'all') return true;
        const currentStatus = (item.status || 'pending').toLowerCase().trim();
        const targetStatuses = tabs.find(t => t.id === activeTab)?.statuses || [];
        return targetStatuses.includes(currentStatus);
    });

    // --- HELPER: CEK APAKAH WAKTU SUDAH LEWAT ---
    const isTimePassed = (dateString) => {
        if (!dateString) return false;
        const targetDate = new Date(dateString);
        const now = new Date();
        return now > targetDate;
    };

    // --- LOGIKA RETURN BARANG ---
    const handleReturnClick = (id) => {
        setCustomAlert({
            isOpen: true,
            message: "Waktu pengiriman telah lewat. Apakah Anda ingin mengajukan pengembalian (Return)?",
            type: 'warning',
            showCancel: true,
            confirmText: "Ya, Ajukan Return",
            cancelText: "Batal",
            onConfirm: () => executeReturnOrder(id)
        });
    };

    const executeReturnOrder = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/orders/${id}/return`, {
                method: 'POST', 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status: 'return_requested' }) 
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setCustomAlert({
                    isOpen: true,
                    message: "Pengajuan Return berhasil dikirim.",
                    type: 'success',
                    showCancel: false,
                    confirmText: "OK"
                });
                fetchOrders();
            } else {
                setCustomAlert({
                    isOpen: true,
                    message: "Gagal: " + (data.message || "Terjadi kesalahan"),
                    type: 'error',
                    showCancel: false,
                    confirmText: "OK"
                });
            }
        } catch (error) {
            setCustomAlert({
                isOpen: true,
                message: "Gagal koneksi ke server.",
                type: 'error',
                showCancel: false,
                confirmText: "OK"
            });
        }
    };

    // --- LOGIKA TERIMA PESANAN ---
    const handleReceiveOrder = (id) => {
        setCustomAlert({
            isOpen: true,
            message: "Apakah Anda yakin barang sudah diterima dengan baik?",
            type: 'warning', 
            showCancel: true,
            confirmText: "Ya, Diterima",
            cancelText: "Batal",
            onConfirm: () => executeReceiveOrder(id)
        });
    };

    const executeReceiveOrder = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/orders/${id}/receive`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setCustomAlert({
                    isOpen: true,
                    message: "Terima kasih! Pesanan selesai.",
                    type: 'success', 
                    showCancel: false,
                    confirmText: "OK"
                });
                fetchOrders();
            } else {
                setCustomAlert({
                    isOpen: true,
                    message: "Gagal: " + (data.message || "Terjadi kesalahan"),
                    type: 'error',
                    showCancel: false,
                    confirmText: "OK"
                });
            }
        } catch (error) {
            setCustomAlert({
                isOpen: true,
                message: "Gagal koneksi ke server.",
                type: 'error',
                showCancel: false,
                confirmText: "OK"
            });
        }
    };

    // --- LOGIKA BATALKAN PESANAN ---
    const handleCancelClick = (orderId) => {
        setCustomAlert({
            isOpen: true,
            message: "Yakin ingin membatalkan pesanan ini?",
            type: 'warning',
            showCancel: true,
            confirmText: "Ya, Batalkan",
            cancelText: "Kembali",
            onConfirm: () => executeCancelOrder(orderId)
        });
    };

    const executeCancelOrder = async (orderId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setOrders(prev => prev.map(order => 
                    order.id === orderId ? { ...order, status: 'dibatalkan' } : order
                ));

                setCustomAlert({
                    isOpen: true,
                    message: "Pesanan berhasil dibatalkan",
                    type: 'success', 
                    showCancel: false,
                    confirmText: "OK",
                    onConfirm: null
                });
            } else {
                setCustomAlert({
                    isOpen: true,
                    message: "Gagal: " + (data.message || "Terjadi kesalahan"),
                    type: 'error',
                    showCancel: false,
                    confirmText: "OK"
                });
            }
        } catch (error) {
            setCustomAlert({
                isOpen: true,
                message: "Terjadi kesalahan koneksi.",
                type: 'error',
                showCancel: false,
                confirmText: "OK"
            });
        }
    };

    // --- LOGIKA HAPUS RIWAYAT ---
    const handleDeleteHistory = (id) => {
        setCustomAlert({
            isOpen: true,
            message: "Hapus riwayat pesanan ini? Data akan hilang permanen.",
            type: 'warning',
            showCancel: true,
            confirmText: "Ya, Hapus",
            cancelText: "Batal",
            onConfirm: () => executeDeleteHistory(id)
        });
    };

    const executeDeleteHistory = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/orders/${id}`, { 
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                setOrders(prevOrders => prevOrders.filter(order => order.id !== id));
                setCustomAlert({
                    isOpen: true,
                    message: "Riwayat pesanan dihapus.",
                    type: 'success', 
                    showCancel: false,
                    confirmText: "OK"
                });
            } else {
                setCustomAlert({
                    isOpen: true,
                    message: "Gagal menghapus riwayat.",
                    type: 'error',
                    showCancel: false,
                    confirmText: "OK"
                });
            }
        } catch (error) {
            setCustomAlert({
                isOpen: true,
                message: "Terjadi kesalahan sistem.",
                type: 'error',
                showCancel: false,
                confirmText: "OK"
            });
        }
    };

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
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    pesanan_id: selectedOrder.id,
                    produk_id: targetProductId,
                    rating: rating,
                    comment: reviewText
                })
            });

            const data = await response.json();

            if (response.ok) {
                setCustomAlert({
                    isOpen: true,
                    message: "Ulasan berhasil dikirim! Terima kasih.",
                    type: 'success', 
                    showCancel: false,
                    confirmText: "OK"
                });
                setIsRatingModalOpen(false);
            } else {
                alert("Gagal: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan koneksi atau server error.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getProfilePhoto = () => {
        if (user.profile_photo) {
            if (user.profile_photo.startsWith('http')) {
                return user.profile_photo;
            }
            return `http://127.0.0.1:8000/storage/${user.profile_photo}`;
        }
        return null;
    };

    const getProductImage = (produk) => {
        if (!produk) return "https://via.placeholder.com/150";
        if (Array.isArray(produk.foto_barang) && produk.foto_barang.length > 0) {
            return `http://127.0.0.1:8000/storage/${produk.foto_barang[0]}`;
        }
        if (typeof produk.foto_barang === 'string' && produk.foto_barang) {
            return produk.foto_barang.startsWith('http') 
                ? produk.foto_barang 
                : `http://127.0.0.1:8000/storage/${produk.foto_barang}`;
        }
        return "https://via.placeholder.com/150?text=No+Image";
    };

    const formatRupiah = (num) => {
        const n = Number(num);
        if (isNaN(n)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(n);
    };
    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    // --- HELPER: CEK APAKAH MASIH BISA RETURN (BATAS 24 JAM) ---
    const isReturnEligible = (dateString) => {
        if (!dateString) return false;
        
        const finishedDate = new Date(dateString);
        const now = new Date();
        
        // Hitung selisih waktu dalam milidetik
        const diffInMs = now - finishedDate;
        
        // Konversi ke jam (1 jam = 1000ms * 60detik * 60menit)
        const diffInHours = diffInMs / (1000 * 60 * 60);
        
        // Return TRUE jika kurang dari 24 jam
        return diffInHours <= 24;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-blue-50 w-full font-sans pb-20">
            
            {/* 1. NAVBAR */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight decoration-none">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/keranjang" className="text-2xl text-gray-500 hover:text-blue-900">
                            <img src={iconKeranjang} alt="keranjang" className="w-10 h-10 object-contain opacity-60 group-hover:opacity-100 transition duration-200"/>
                        </Link>
                        <Link 
                            to="/" 
                            className="text-gray-500 hover:text-blue-900 transition p-1" 
                            title="Dashboard">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                            </svg>
                        </Link>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition border border-transparent hover:border-gray-200">
                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100 bg-gray-200">
                                    {getProfilePhoto() ? (
                                        <img src={getProfilePhoto()} alt="Profile" className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-lg bg-blue-50">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs text-gray-500 font-medium">Halo,</p>
                                    <p className="text-sm font-bold text-gray-800 max-w-[120px] truncate">{user.name}</p>
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-fade-in-down">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                                            {getProfilePhoto() ? (
                                                <img src={getProfilePhoto()} alt="Profile" className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold bg-blue-50">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500">Pembeli</p>
                                        </div>
                                    </div>
                                    <div className="py-2">
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2">Edit Profil</Link>
                                    </div>
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition">Keluar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* 2. CONTAINER UTAMA */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                                
                <div className="flex flex-col lg:flex-row gap-6 items-start">                    
                    {/* SIDEBAR MENU (KIRI) */}
                    <div className="w-full lg:w-64 flex-shrink-0 sticky top-24 z-30">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4 px-1 hidden lg:block">
                            Riwayat Pesanan
                        </h1>
                        {/* Judul Khusus Mobile (Hilang di Layar Besar) */}
                        <h1 className="text-2xl font-bold text-gray-800 mb-4 lg:hidden">
                            Riwayat Pesanan
                        </h1>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 hidden lg:flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 text-sm">Status Pesanan</h3>
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    {orders.length}
                                </span>
                            </div>
                            
                            {/* Desktop: Vertical List */}
                            <div className="hidden lg:flex flex-col p-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all mb-1 flex justify-between items-center ${
                                            activeTab === tab.id 
                                            ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' 
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && <span className="text-blue-500">•</span>}
                                    </button>
                                ))}
                            </div>

                            {/* Mobile: Horizontal List */}
                            <div className="lg:hidden flex overflow-x-auto no-scrollbar p-2 gap-2 border-b border-gray-100">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap border transition-all ${
                                            activeTab === tab.id 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* KONTEN UTAMA (KANAN) */}
                    <div className="flex-1 w-full min-w-0">
                        {filteredOrders.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <img src={iconBelumada} alt="belumada" className="w-24 h-24 object-contain opacity-60 mb-4"/>
                                {activeTab === 'all' || orders.length === 0 ? (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada pesanan</h2>
                                        <p className="text-gray-500 mb-6 text-sm">Belum ada transaksi di akun Anda.</p>
                                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg no-underline">Mulai Belanja</Link>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-gray-500 text-sm">Tidak ada pesanan di status "{tabs.find(t => t.id === activeTab)?.label}"</h2>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredOrders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition duration-200">
                                        
                                        {/* Header Card */}
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white border border-gray-200 p-1.5 rounded text-xs font-mono font-bold text-gray-600">
                                                    {order.invoice_code || `INV-${order.id}`}
                                                </div>
                                                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                                                     {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                                            ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                            order.status === 'selesai' ? 'bg-green-50 text-green-700 border-green-200' : 
                                            order.status === 'dikirim' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            order.status === 'return_requested' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                            'bg-red-50 text-red-700 border-red-200'}`}>
                                                {order.status === 'return_requested' ? 'Return' : order.status}
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {order.detail_pesanan?.map((detail, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_auto] gap-4 items-start border-b border-dashed border-gray-100 pb-4 last:border-0 last:pb-0">
                                                    
                                                    {/* Produk Info */}
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                                            <img src={getProductImage(detail.produk)} alt={detail.produk?.nama_barang} className="w-full h-full object-cover" onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}/>
                                                        </div>
                                                        <div className="flex-1 min-w-0 pt-1">
                                                            <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug">{detail.produk?.nama_barang || 'Produk dihapus'}</h4>
                                                            <p className="text-xs text-gray-500 mt-1">{detail.jumlah} x {formatRupiah(detail.produk?.harga_barang || 0)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Penjual & Alamat (Hanya Baris Pertama) */}
                                                    <div className="hidden md:block text-xs text-gray-600 border-l border-gray-100 pl-4 h-full">
                                                        {index === 0 && (
                                                            <>
                                                                <div className="mb-3">
                                                                    <p className="font-bold text-gray-400 uppercase text-[10px] mb-0.5">Penjual</p>
                                                                    <div className="flex items-center gap-1 font-semibold text-gray-700">
                                                                        <span></span> {detail.produk?.user?.name || "Official Store"}
                                                                    </div>
                                                                    {/* --- BAGIAN INI SAYA KEMBALIKAN (TELEPON) --- */}
                                                                    <div className="flex items-center gap-1 text-gray-500 mt-1">
                                                                        <span></span> {detail.produk?.user?.phone || detail.produk?.user?.telepon || detail.produk?.user?.no_hp || "-"}
                                                                    </div>
                                                                    {/* ------------------------------------------- */}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-400 uppercase text-[10px] mb-0.5">Pengiriman</p>
                                                                    <p className="line-clamp-1">{order.alamat_pengiriman || "-"}</p>
                                                                    {order.waktu_pengiriman && <p className="text-blue-600 font-medium mt-0.5">Estimasi: {formatDate(order.waktu_pengiriman)}</p>}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Total & Aksi */}
                                                    <div className="text-right flex flex-col items-end justify-between h-full gap-2">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Subtotal</p>
                                                            <p className="font-bold text-gray-800 text-sm">{formatRupiah((detail.produk?.harga_barang || 0) * detail.jumlah)}</p>
                                                        </div>
                                                        
                                                        {/* Logika: Hanya muncul jika status 'selesai' DAN belum lewat 24 jam dari waktu update terakhir */}
                                                        {index === 0 && order.status === 'selesai' && isReturnEligible(order.updated_at) && (
                                                            <button 
                                                                onClick={() => handleReturnClick(order.id)} 
                                                                className="px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded text-[10px] font-bold hover:bg-orange-100 transition shadow-sm w-full"
                                                            >
                                                                Ajukan Return
                                                            </button>
                                                        )}

                                                        {index === 0 && isTimePassed(order.waktu_pengiriman) && 
                                                        order.status !== 'selesai' && 
                                                        order.status !== 'pending' && 
                                                        !order.status.toLowerCase().includes('cancel') && 
                                                        !order.status.toLowerCase().includes('dibatalkan') && 
                                                        !order.status.toLowerCase().includes('return') && /* <--- TAMBAHAN INI */
                                                        (
                                                            <button onClick={() => handleCancelClick(order.id)} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold hover:bg-red-100 transition shadow-sm w-full">
                                                                Batalkan Pesanan
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-500 font-bold uppercase">Total Bayar:</p>
                                                <p className="text-lg font-extrabold text-blue-700">{formatRupiah(order.grand_total)}</p>
                                            </div>
                                            
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                <button onClick={() => {const seller = order.detail_pesanan?.[0]?.produk?.user; openChat(seller?.id, seller?.name);}} className="px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-lg text-xs font-bold hover:bg-blue-50 transition shadow-sm flex items-center gap-1">
                                                    💬 Chat
                                                </button>
                                                
                                                {(order.status.toLowerCase().includes('dibatalkan') || order.status.toLowerCase().includes('cancel')) && (
                                                    <button onClick={() => handleDeleteHistory(order.id)} className="px-4 py-2 bg-white text-gray-500 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-100 transition shadow-sm">Hapus Riwayat</button>
                                                )}

                                                {order.status === 'pending' && (
                                                    <button onClick={() => handleCancelClick(order.id)} className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 transition shadow-sm">Batalkan</button>
                                                )}

                                                {order.status === 'dikirim' && (
                                                    <button onClick={() => handleReceiveOrder(order.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm shadow-green-200">Pesanan Diterima</button>
                                                )}

                                                {/* Logika Baru: Muncul jika Selesai ATAU mengandung kata 'return' */}
                                                {(order.status === 'selesai' || order.status.toLowerCase().includes('return')) && (
                                                    <button onClick={() => openRatingModal(order)} className="px-4 py-2 bg-yellow-400 text-white rounded-lg text-xs font-bold hover:bg-yellow-500 transition shadow-sm flex items-center gap-1 shadow-yellow-200">
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
                </div>
            </div>

            {/* MODAL DAN POPUP */}
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
                                    <button key={star} onClick={() => setRating(star)} className={`text-4xl transition transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                                ))}
                            </div>
                            <textarea className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none" placeholder="Ceritakan pengalamanmu..." value={reviewText} onChange={(e) => setReviewText(e.target.value)}></textarea>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm">Batal</button>
                                <button onClick={handleSubmitRating} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg text-sm">Kirim Ulasan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {customAlert.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center transform scale-100 transition-all">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${customAlert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : customAlert.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <span className="text-3xl font-bold">{customAlert.type === 'warning' ? '?' : customAlert.type === 'success' ? '✓' : '!'}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{customAlert.message}</h3>
                        <div className="flex gap-3">
                            {customAlert.showCancel && <button onClick={() => setCustomAlert({...customAlert, isOpen: false})} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition shadow-sm">{customAlert.cancelText}</button>}
                            <button onClick={() => { setCustomAlert({...customAlert, isOpen: false}); if(customAlert.onConfirm) customAlert.onConfirm(); }} className={`flex-1 py-2.5 rounded-xl font-bold text-white transition shadow-lg ${customAlert.type === 'warning' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{customAlert.confirmText}</button>
                        </div>
                    </div>
                </div>
            )}

            <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} receiverId={chatTarget.id} receiverName={chatTarget.name} />

        </div>
    );
}