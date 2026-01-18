import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SellerOrders() {
    const [sellerOrders, setSellerOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});

    // --- STATE NAVBAR ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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

    // --- LOGIKA UPDATE STATUS (FITUR BARU) ---
    const handleUpdateStatus = async (item, newStatus) => {
        // Konfirmasi khusus untuk pembatalan
        if (newStatus === 'dibatalkan' && !confirm("Yakin ingin menolak/membatalkan pesanan ini?")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/seller/orders/${item.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();

            if(response.ok) {
                // Tidak perlu alert biar lebih cepat, langsung refresh data
                fetchSellerOrders();
            } else {
                alert("Gagal: " + data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan koneksi");
        }
    };

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

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false // Format 24 jam
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
                        <div className="hidden md:flex items-center gap-2 px-2">
                            <span className="font-bold text-gray-800">Pesanan Masuk</span>
                        </div>
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
                        <p className="text-gray-500 mt-1">Kelola pesanan yang masuk ke toko Anda</p>
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
                            // Ambil status dari pesanan induk
                            const currentStatus = item.pesanan?.status || 'pending';

                            return (
                                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                                    
                                    {/* Header Card */}
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                👤
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {item.pesanan?.nama_penerima || "Pembeli"} 
                                                    <span className="text-gray-400 font-normal ml-2 text-xs">({formatDate(item.created_at)})</span>
                                                </p>
                                                <p className="text-xs text-gray-500">{item.pesanan?.invoice_code}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Badge Status */}
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                            ${currentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                              currentStatus === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                              currentStatus === 'sent' ? 'bg-purple-100 text-purple-700' :
                                              currentStatus === 'finished' ? 'bg-green-100 text-green-700' :
                                              'bg-red-100 text-red-700'}`}>
                                            {currentStatus}
                                        </span>
                                    </div>

                                    {/* Body Card */}
                                    <div className="p-6 flex flex-col sm:flex-row gap-6">
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                            <img 
                                                src={item.produk?.foto_barang} 
                                                alt={item.produk?.nama_barang} 
                                                className="w-full h-full object-cover"
                                                onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg">{item.produk?.nama_barang}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Jumlah: <span className="font-bold text-gray-800">{item.jumlah} Unit</span>
                                            </p>
                                            <p className="text-blue-600 font-bold text-lg mt-2">
                                                Total: {formatRupiah((item.jumlah * item.produk?.harga_barang))}
                                            </p>
                                        </div>
                                        <div className="w-full sm:w-1/3 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex flex-col justify-between">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Alamat Pengiriman</p>
                                            <p className="text-sm text-gray-700 leading-snug">
                                                {item.pesanan?.alamat_pengiriman || "Alamat tidak tersedia"}
                                            </p>
                                            <div className="mb-3">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Jadwal Kirim</p>
                                                <div className="flex items-center gap-2 bg-white border border-blue-100 px-2 py-1 rounded text-blue-700 font-bold text-sm">
                                                    <span>⏰</span>
                                                    {formatDateTime(item.pesanan?.waktu_pengiriman)}
                                                </div>
                                                <span className="text-xs text-gray-500">📞 {item.pesanan?.telepon_penerima || "-"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- FOOTER: TOMBOL AKSI BERDASARKAN STATUS --- */}
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-end gap-3">
                                        
                                        {/* Status PENDING: Bisa Terima atau Tolak */}
                                        {currentStatus === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => handleUpdateStatus(item, 'dibatalkan')}
                                                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold text-sm hover:bg-red-200 transition border border-red-200"
                                                >
                                                    Reject Order
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(item, 'accepted')}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-sm"
                                                >
                                                    receive orders
                                                </button>
                                            </>
                                        )}

                                        {/* Status ACCEPTED: Harus Kirim Barang */}
                                        {currentStatus === 'accepted' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(item, 'sent')}
                                                className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-bold text-sm hover:bg-yellow-600 transition shadow-sm flex items-center gap-2"
                                            >
                                                order sent
                                            </button>
                                        )}

                                        {/* Status SENT: Bisa Selesaikan (Jika pembeli lupa konfirmasi) */}
                                        {currentStatus === 'sent' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(item, 'finished')}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition shadow-sm flex items-center gap-2"
                                            >
                                                order completed
                                            </button>
                                        )}

                                        {/* Status FINISHED / DIBATALKAN: Tidak ada aksi */}
                                        {(currentStatus === 'finished' || currentStatus === 'dibatalkan') && (
                                            <span className="text-xs text-gray-400 font-medium italic">
                                                Pesanan {currentStatus}
                                            </span>
                                        )}

                                    </div>
                                    
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}