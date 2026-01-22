import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatBox from './ChatBox';
import iconPesanan from './asset/pesan.png'

export default function SellerOrders() {
    const [sellerOrders, setSellerOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});

    // --- STATE CHAT ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState({ id: null, name: '' });

    // Fungsi Buka Chat
    const openChat = (buyerId, buyerName) => {
        setChatTarget({ id: buyerId, name: buyerName });
        setIsChatOpen(true);
    };

    // --- STATE NAVBAR ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- STATE MODAL (POPUP) TERIMA PESANAN ---
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveryTime, setDeliveryTime] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (userData) setUser(JSON.parse(userData));

        fetchSellerOrders();

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

    const fetchSellerOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/seller/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSellerOrders(data.data);
            }
        } catch (error) {
            console.error("Error fetching seller orders:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- FUNGSI UPDATE STATUS (DIPERBAIKI UNTUK MENANGANI PEMBATALAN) ---
    const handleUpdateStatus = async (item, newStatus) => {
        if (newStatus === 'dibatalkan' && !confirm("Yakin ingin menolak/membatalkan pesanan ini?")) return;

        const token = localStorage.getItem('token');
        
        // LOGIKA PERBAIKAN: 
        // Jika status 'dibatalkan', gunakan route cancel yang sama dengan pembeli.
        // Jika status lain (dikirim/selesai), gunakan route update seller biasa.
        const url = newStatus === 'dibatalkan' 
            ? `http://127.0.0.1:8000/api/orders/${item.id}/cancel`
            : `http://127.0.0.1:8000/api/seller/orders/${item.id}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' // Penting agar error terbaca
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();

            if(response.ok) {
                // alert("Berhasil"); 
                fetchSellerOrders();
            } else {
                alert("Gagal: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan koneksi");
        }
    };

    // --- FUNGSI BUKA MODAL ---
    const openAcceptModal = (item) => {
        setSelectedOrder(item);
        setDeliveryTime('');
        setIsAcceptModalOpen(true);
    };

    // --- FUNGSI KONFIRMASI TERIMA DENGAN WAKTU ---
    const handleConfirmAccept = async () => {
        if (!deliveryTime) {
            alert("Harap tentukan estimasi waktu kirim!");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/seller/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    status: 'accepted',
                    waktu_pengiriman: deliveryTime 
                })
            });
            
            const data = await response.json();

            if(response.ok) {
                alert("Pesanan diterima! Segera siapkan paket.");
                setIsAcceptModalOpen(false);
                fetchSellerOrders();
            } else {
                alert("Gagal: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan koneksi");
        }
    };

    const handleDeleteOrder = async (id) => {
        if (!confirm("Hapus riwayat pesanan ini selamanya?")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/seller/orders/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' 
                }
            });

            const data = await response.json(); 

            if (response.ok) {
                setSellerOrders(prev => prev.filter(order => order.id !== id));
                alert("Berhasil dihapus!");
            } else {
                alert("Gagal: " + (data.message || "Terjadi kesalahan sistem"));
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Gagal koneksi ke server.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- HELPER GAMBAR (INI SAYA TAMBAHKAN AGAR GAMBAR MUNCUL) ---
    const getProductImage = (product) => {
        if (!product) return "https://via.placeholder.com/150";
        // 1. Cek Array (Banyak Foto)
        if (Array.isArray(product.foto_barang) && product.foto_barang.length > 0) {
            return `http://127.0.0.1:8000/storage/${product.foto_barang[0]}`;
        }
        // 2. Cek String (Satu Foto)
        if (typeof product.foto_barang === 'string' && product.foto_barang) {
            return product.foto_barang.startsWith('http') 
                ? product.foto_barang 
                : `http://127.0.0.1:8000/storage/${product.foto_barang}`;
        }
        return "https://via.placeholder.com/150?text=No+Image";
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

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 w-full font-sans pb-20">
            
            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight decoration-none">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/my-products" className="text-gray-500 hover:text-blue-600 font-medium px-4 py-2 transition decoration-none border-r border-gray-300 pr-4">
                            Produk Saya
                        </Link>
                        <Link to="/" className="txt-gray-500 hover:text-blue-600 font-medium px-4 py-2 transition decoration-none">
                            Dashboard
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

            {/* --- KONTEN UTAMA --- */}
            <div className="max-w-6xl mx-auto px-4">
                
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Pesanan Masuk</h1>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold">
                        Total: {sellerOrders.length} Pesanan
                    </div>
                </div>

                {sellerOrders.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
                        <div className="text-6xl mb-4">📭</div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada pesanan masuk</h2>
                        <Link to="/my-products" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg decoration-none">
                            Kelola Produk
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {sellerOrders.map((item) => {
                            const currentStatus = item.pesanan?.status || 'pending';
                            const isCancelled = currentStatus.includes('dibatalkan') || currentStatus.includes('cancel');

                            return (
                                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                                    
                                    {/* Header Card */}
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">👤</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {item.pesanan?.nama_penerima || "Pembeli"} 
                                                    <span className="text-gray-400 font-normal ml-2 text-xs">({formatDate(item.created_at)})</span>
                                                </p>
                                                <p className="text-xs text-gray-500">{item.pesanan?.invoice_code}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                            ${currentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                currentStatus === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                                currentStatus === 'dikirim' ? 'bg-purple-100 text-purple-700' :
                                                currentStatus === 'selesai' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'}`}>
                                            {currentStatus}
                                        </span>
                                    </div>

                                    {/* Body Card */}
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            
                                            {/* 1. PRODUK (KIRI) */}
                                            <div className="flex gap-4 flex-1">
                                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                    {/* --- MENGGUNAKAN HELPER getProductImage DI SINI --- */}
                                                    <img 
                                                        src={getProductImage(item.produk)} 
                                                        alt={item.produk?.nama_barang} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-lg line-clamp-2 leading-tight mb-1">{item.produk?.nama_barang}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        Jumlah: <span className="font-bold text-gray-800">{item.jumlah} Unit</span>
                                                    </p>
                                                    <p className="text-blue-600 font-bold text-lg mt-1">
                                                        Total: {formatRupiah((item.jumlah * item.produk?.harga_barang))}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 2. ALAMAT (TENGAH) */}
                                            <div className="w-full lg:w-1/3 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex flex-col justify-center text-sm">
                                                <div className="mb-3">
                                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Alamat Pengiriman</p>
                                                    <p className="text-gray-700 leading-snug">
                                                        {item.pesanan?.alamat_pengiriman || "Alamat tidak tersedia"}
                                                    </p>
                                                </div>
                                                <div className="mb-2">
                                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Jadwal Kirim</p>
                                                    <div className="flex items-center gap-2 text-blue-700 font-bold">
                                                        <span>⏰</span>
                                                        {formatDateTime(item.pesanan?.waktu_pengiriman)}
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-gray-200 text-gray-500 font-medium text-xs">
                                                    📞 {item.pesanan?.telepon_penerima || "-"}
                                                </div>
                                            </div>

                                            {/* 3. TOMBOL AKSI (KANAN) */}
                                            <div className="flex flex-col gap-3 w-full lg:w-auto min-w-[180px] justify-center">

                                                {currentStatus === 'pending' && (
                                                    <>
                                                        <button onClick={() => openAcceptModal(item)} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm">
                                                            Terima Pesanan
                                                        </button>
                                                        <button onClick={() => handleUpdateStatus(item, 'dibatalkan')} className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-sm hover:bg-red-50 transition">
                                                            Tolak Pesanan
                                                        </button>
                                                    </>
                                                )}

                                                <Link to="/Pesanan" className="relative group flex items-center">
                                                    <img 
                                                    src={iconPesanan} 
                                                    alt="Pesanan" 
                                                    className="w-10 h-10 object-contain opacity-60 group-hover:opacity-100 transition duration-200"
                                                    />
                                                </Link>
                                                
                                                {currentStatus === 'accepted' && (
                                                    <button onClick={() => handleUpdateStatus(item, 'dikirim')} className="w-full py-2 bg-yellow-500 text-white rounded-lg font-bold text-sm hover:bg-yellow-600 transition shadow-sm">
                                                        Kirim Barang
                                                    </button>
                                                )}
                                                
                                                {currentStatus === 'dikirim' && (
                                                    <button onClick={() => handleUpdateStatus(item, 'selesai')} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition shadow-sm">
                                                        🏁 Selesaikan
                                                    </button>
                                                )}
                                                
                                                {(currentStatus === 'selesai' || isCancelled) && (
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-400 font-medium italic mb-2">
                                                            {isCancelled ? 'Pesanan Batal' : 'Pesanan Selesai'}
                                                        </div>
                                                        <button onClick={() => handleDeleteOrder(item.id)} className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg font-bold text-sm hover:bg-red-100 hover:text-red-600 transition border border-gray-200">
                                                            🗑️ Hapus Riwayat
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                    
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- POPUP MODAL ATUR JADWAL PENGIRIMAN --- */}
            {isAcceptModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Atur Jadwal Pengiriman</h3>
                            <button onClick={() => setIsAcceptModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Kapan barang akan dikirim?</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={deliveryTime}
                                    onChange={(e) => setDeliveryTime(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Masukkan estimasi waktu Anda mengirim barang ke kurir/pembeli.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={() => setIsAcceptModalOpen(false)} 
                                    className="flex-1 py-2 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleConfirmAccept} 
                                    className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg"
                                >
                                    Konfirmasi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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