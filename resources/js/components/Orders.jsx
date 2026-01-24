import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox';
import iconKeranjang from './asset/keranjang.png'
import iconHome from './asset/home.png'
import iconBelumada from './asset/belumada.png'


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

    // --- STATE POPUP NOTIFIKASI ---
    const [customAlert, setCustomAlert] = useState({
        isOpen: false,
        message: '',
        type: 'success', // 'success', 'error', atau 'warning'
        showCancel: false,
        confirmText: 'OK',
        cancelText: 'Batal',
        onConfirm: null
    });

    // --- EFFECT: AUTO-CLOSE UNTUK TOAST SUCCESS ---
    useEffect(() => {
        let timer;
        // Hanya auto-close jika BUKAN konfirmasi (tidak ada tombol cancel)
        if (customAlert.isOpen && !customAlert.showCancel && customAlert.type === 'success') {
            timer = setTimeout(() => {
                setCustomAlert(prev => ({ ...prev, isOpen: false }));
            }, 3000); 
        }
        return () => clearTimeout(timer);
    }, [customAlert]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (userData) setUser(JSON.parse(userData));

        const fetchUserData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/user', {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                const data = await response.json();
                
                if (response.ok) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                }
            } catch (error) {
                console.error("Gagal refresh user:", error);
            }
        };

        fetchOrders(); // Panggil fungsi fetch orders
        fetchUserData();

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

    // --- HELPER: CEK APAKAH WAKTU SUDAH LEWAT ---
    const isTimePassed = (dateString) => {
        if (!dateString) return false;
        const targetDate = new Date(dateString);
        const now = new Date();
        // Return TRUE jika Waktu Sekarang LEBIH BESAR dari Waktu Target
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
            // MENGGUNAKAN POST (Sesuai update route API Anda)
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
                        <Link to="/keranjang" className="text-2xl text-gray-500 hover:text-blue-900">
                            <img 
                            src={iconKeranjang} 
                            alt="keranjang" 
                            className="w-10 h-10 object-contain opacity-60 group-hover:opacity-100 transition duration-200"
                            />
                        </Link>
                        <Link to="/" className="hidden md:inline-flex items-center text-gray-500 hover:text-blue-600 font-medium transition no-underline text-sm border-r border-gray-300 pr-6">
                            <span className="mr-1 text-lg"></span>Dashboard
                        </Link>
                        <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition border border-transparent hover:border-gray-200"
                                >
                                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100 bg-gray-200">
                                        {getProfilePhoto() ? (
                                            <img 
                                                src={getProfilePhoto()} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
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
                                        {/* Header Dropdown */}
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

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2">
                                                Edit Profil
                                            </Link>
                                            <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2">
                                                Riwayat Pesanan
                                            </Link>
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button 
                                                onClick={handleLogout} 
                                                className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                                            >
                                                Keluar
                                            </button>
                                        </div>
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
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                        <img 
                        src={iconBelumada} 
                        alt="belumada" 
                        className="w-25 h-20 object-contain opacity-60 group-hover:opacity-100 transition duration-200"
                        />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada pesanan</h2>
                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg no-underline">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                
                                <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-gray-700 font-mono">{order.invoice_code || `INV-${order.id}`}</p>
                                        <span className="text-gray-300">|</span>
                                        <p className="text-[10px] text-gray-500">{formatDate(order.created_at)}</p>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide 
                                    ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 
                                      order.status === 'selesai' ? 'bg-green-50 text-green-700 border border-green-100' : 
                                      order.status === 'dikirim' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                      order.status === 'return_requested' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                      'bg-red-50 text-red-700 border border-red-100'}`}>
                                        {order.status === 'return_requested' ? 'Return' : order.status}
                                    </div>
                                </div>

                                <div className="p-3 space-y-3">
                                    {order.detail_pesanan?.map((detail, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-4 items-start border-b border-dashed border-gray-100 pb-3 last:border-0 last:pb-0">
                                            
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                                    <img 
                                                        src={getProductImage(detail.produk)} 
                                                        alt={detail.produk?.nama_barang} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{detail.produk?.nama_barang || 'Produk dihapus'}</h4>
                                                    <p className="text-[11px] text-gray-500">{detail.jumlah} x {formatRupiah(detail.produk?.harga_barang || 0)}</p>
                                                </div>
                                            </div>

                                            <div className="hidden md:block">
                                                <div className="p-2 rounded border border-gray-100 bg-gray-50 text-[10px]">
                                                    <div className="mb-1">
                                                        <span className="font-bold text-gray-400 uppercase block mb-0.5">Penjual</span>
                                                        <div className="flex items-center gap-1 font-semibold text-gray-700">
                                                            <span className="text-base">👤</span>
                                                            <span className="truncate">
                                                                {detail.produk?.user?.name || "Official Store"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <span className="text-xs">📞</span>
                                                            <span>
                                                                {detail.produk?.user?.phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="hidden md:block">
                                                {index === 0 && (
                                                    <div className="p-2 bg-blue-50 bg-opacity-40 rounded border border-blue-100 text-[10px]">
                                                        <div className="mb-1">
                                                            <span className="font-bold text-gray-400 uppercase">Kirim ke: </span>
                                                            <span className="font-semibold text-gray-700 truncate block">
                                                                {order.alamat_pengiriman || "-"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-blue-800">
                                                                ⏰ {formatDate(order.waktu_pengiriman || order.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* --- AREA KANAN: HARGA & TOMBOL RETURN/CANCEL (PINDAH KESINI) --- */}
                                            <div className="text-right flex flex-col items-end gap-2">
                                                <p className="font-bold text-gray-800 text-sm">{formatRupiah((detail.produk?.harga_barang || 0) * detail.jumlah)}</p>
                                                
                                                {/* LOGIKA RETURN: HANYA MUNCUL JIKA STATUS SELESAI */}
                                                {index === 0 && order.status === 'selesai' && (
                                                    <button 
                                                        onClick={() => handleReturnClick(order.id)}
                                                        className="px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded text-[10px] font-bold hover:bg-orange-100 transition shadow-sm"
                                                    >
                                                        Ajukan Return
                                                    </button>
                                                )}

                                                {/* LOGIKA BATALKAN (JIKA WAKTU LEWAT & BELUM SELESAI & BUKAN PENDING) */}
                                                {index === 0 && isTimePassed(order.waktu_pengiriman) && 
                                                 order.status !== 'selesai' && 
                                                 order.status !== 'pending' && // <-- TAMBAHAN KONDISI INI
                                                 !order.status.toLowerCase().includes('cancel') && 
                                                 !order.status.toLowerCase().includes('dibatalkan') && (
                                                    <button 
                                                        onClick={() => handleCancelClick(order.id)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold hover:bg-red-100 transition shadow-sm"
                                                    >
                                                        Batalkan Pesanan
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>

                                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[11px] text-gray-500 font-bold">Total:</p>
                                        <p className="text-base font-extrabold text-blue-700">{formatRupiah(order.grand_total)}</p>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => {
                                                const seller = order.detail_pesanan?.[0]?.produk?.user;
                                                openChat(seller?.id, seller?.name);
                                            }}
                                            className="px-3 py-1 bg-white text-blue-600 border border-blue-300 rounded text-[10px] font-bold hover:bg-blue-50 transition shadow-sm flex items-center gap-1"
                                        >
                                            💬 Chat Penjual
                                        </button>
                                        
                                        {/* (SEMUA TOMBOL RETURN/CANCEL SUDAH DIHAPUS DARI SINI) */}

                                        {(order.status.toLowerCase().includes('dibatalkan') || order.status.toLowerCase().includes('cancel')) && (
                                            <button 
                                                onClick={() => handleDeleteHistory(order.id)}
                                                className="px-3 py-1 bg-white text-gray-500 border border-gray-300 rounded text-[10px] font-bold hover:bg-gray-100 transition shadow-sm"
                                            >
                                                Hapus
                                            </button>
                                        )}

                                        {order.status === 'pending' && (
                                            <button 
                                                onClick={() => handleCancelClick(order.id)}
                                                className="px-3 py-1 bg-white text-red-600 border border-red-200 rounded text-[10px] font-bold hover:bg-red-50 transition shadow-sm"
                                            >
                                                Batalkan
                                            </button>
                                        )}

                                        {order.status === 'dikirim' && (
                                            <button 
                                                onClick={() => handleReceiveOrder(order.id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded text-[10px] font-bold hover:bg-green-700 transition shadow-sm"
                                            >
                                                📦 Pesanan Diterima
                                            </button>
                                        )}

                                        {order.status === 'selesai' && (
                                            <button 
                                                onClick={() => openRatingModal(order)}
                                                className="px-3 py-1 bg-yellow-400 text-white rounded text-[10px] font-bold hover:bg-yellow-500 transition shadow-sm flex items-center gap-1"
                                            >
                                                ★ Ulasan
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

            {/* --- CUSTOM POPUP & TOAST RENDERER --- */}
            {customAlert.isOpen && (
                <>
                    {/* TAMPILAN 1: TOAST SUCCESS (Pojok Kanan Atas) */}
                    {customAlert.type === 'success' ? (
                        <div className="fixed top-24 right-4 z-[200] animate-slide-in">
                            <div className="bg-white shadow-xl rounded-lg border-l-4 border-green-500 p-4 flex items-center gap-3 min-w-[300px]">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                    <span className="font-bold text-lg">✓</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm">Berhasil!</h4>
                                    <p className="text-gray-600 text-xs">{customAlert.message}</p>
                                </div>
                                <button 
                                    onClick={() => setCustomAlert({ ...customAlert, isOpen: false })} 
                                    className="text-gray-400 hover:text-gray-600 font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* TAMPILAN 2: MODAL TENGAH (Warning / Error) */
                        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center transform scale-100 transition-all">
                                
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 
                                    ${customAlert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                    
                                    <span className="text-3xl font-bold">
                                        {customAlert.type === 'warning' ? '?' : '!'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    {customAlert.message}
                                </h3>

                                <div className="flex gap-3">
                                    {customAlert.showCancel && (
                                        <button 
                                            onClick={() => setCustomAlert({...customAlert, isOpen: false})}
                                            className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition shadow-sm"
                                        >
                                            {customAlert.cancelText}
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={() => {
                                            setCustomAlert({...customAlert, isOpen: false});
                                            if(customAlert.onConfirm) customAlert.onConfirm();
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-white transition shadow-lg 
                                            ${customAlert.type === 'warning' ? 'bg-red-500 hover:bg-red-600' : 
                                              'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {customAlert.confirmText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <ChatBox 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                receiverId={chatTarget.id} 
                receiverName={chatTarget.name} 
            />

        </div>
    );
}