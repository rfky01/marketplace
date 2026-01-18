import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Orders() {
    const [orders, setOrders] = useState([]);
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

        fetchOrders();

        // Event Listener untuk menutup dropdown saat klik di luar
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
                method: 'PUT', // Atau POST tergantung backend Anda
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                alert("Pesanan berhasil dibatalkan");
                fetchOrders(); // Refresh data
            } else {
                alert("Gagal membatalkan pesanan");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatRupiah = (num) => {
        const n = Number(num); // Paksa ubah ke angka
        if (isNaN(n)) return 'Rp 0'; // Jika gagal, tampilkan 0
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
            
            {/* --- NAVBAR (Sama persis dengan halaman lain) --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
                    
                    {/* Logo Kiri */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight decoration-none">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>

                    {/* Area Kanan Navbar */}
                    <div className="flex items-center gap-6">
                        
                        {/* 1. Kembali Belanja */}
                        <Link to="/" className="hidden md:inline-flex items-center text-gray-500 hover:text-blue-600 font-medium transition no-underline text-sm border-r border-gray-300 pr-6">
                            <span className="mr-1 text-lg"></span>Dashboard
                        </Link>

                        {/* 2. Ikon Keranjang */}
                        <Link to="/keranjang" className="relative group decoration-none">
                            <span className="text-2xl text-gray-400 group-hover:text-blue-600 transition">🛒</span>
                        </Link>

                        {/* 3. Profil User */}
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
            <div className="max-w-5xl mx-auto px-4">
                
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-3xl">📦</span>
                    <h1 className="text-3xl font-bold text-gray-800">Riwayat Pesanan</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
                        <div className="text-6xl mb-4">📭</div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada pesanan</h2>
                        <p className="text-gray-500 mb-6">Yuk mulai belanja barang kebutuhanmu!</p>
                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg no-underline">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    
                                    {/* Header Pesanan */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">No. Invoice</p>
                                            <p className="text-sm font-bold text-gray-800 font-mono">{order.invoice_code || `INV-${order.id}`}</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</p>
                                        </div>
                                        <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                            ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                            order.status === 'success' ? 'bg-green-100 text-green-700' : 
                                            'bg-red-100 text-red-700'}`}>
                                            {order.status}
                                        </div>
                                    </div>

                                {/* List Item */}
                                <div className="p-6">
                                    {order.detail_pesanan?.map((detail, index) => (
                                        <div key={index} className="flex items-center gap-4 mb-4 last:mb-0">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                                <img 
                                                    src={detail.produk?.foto_barang} 
                                                    alt={detail.produk?.nama_barang} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{detail.produk?.nama_barang || 'Produk dihapus'}</h4>
                                                <p className="text-xs text-gray-500">{detail.jumlah} barang x {formatRupiah(detail.produk?.harga_barang || 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-800 text-sm">{formatRupiah((detail.produk?.harga_barang || 0) * detail.jumlah)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Pesanan (Total & Aksi) */}
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Total Tagihan</p>
                                        <p className="text-xl font-extrabold text-blue-600">{formatRupiah(order.grand_total)}</p>
                                    </div>
                                    
                                    {order.status === 'pending' && (
                                        <button 
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 transition"
                                        >
                                            CENCEL
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}