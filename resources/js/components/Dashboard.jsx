import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState({});
    
    // STATE UNTUK DROPDOWN MENU PROFIL
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const dropdownRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            // User belum login
        } else {
            if (userData) {
                setUser(JSON.parse(userData));
            }
            fetchProducts();
        }

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

    const fetchProducts = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/produk');
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleOpenShop = async () => {
        if(!confirm("Apakah Anda ingin mulai berjualan dan membuka toko?")) return;
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/open-shop', {
                method: 'POST',
                headers: {'Authorization': `Bearer ${token}`, 'Accept': 'application/json'}
            });
            const data = await response.json();
            if (response.ok) {
                alert("Selamat! Toko Anda aktif.");
                const updatedUser = { ...user, role: 'penjual' };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else { alert("Gagal: " + data.message); }
        } catch (error) { console.error(error); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    return (
        <div className="min-h-screen bg-gray-100 w-full font-sans">
            
            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
                <div className="w-[90%] mx-auto h-16 flex items-center justify-between px-4">
                    
                    {/* 1. LOGO KIRI */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-green-600 tracking-tight">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                        
                        {/* Search Bar */}
                        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96 border border-gray-200 focus-within:border-green-500 transition">
                            <span className="text-gray-400 mr-2">🔍</span>
                            <input type="text" placeholder="Cari di Marketplace Plus" className="bg-transparent outline-none text-sm w-full" />
                        </div>
                    </div>

                    {/* 2. MENU KANAN (PINDAHAN FITUR DI SINI) */}
                    <div className="flex items-center gap-6">
                        
                        {/* --- PINDAHAN DARI KOTAK HIJAU KE KUNING --- */}
                        {user.role === 'pembeli' ? (
                            <button 
                                onClick={handleOpenShop} 
                                className="text-sm font-bold text-gray-600 hover:text-green-600 transition flex items-center gap-1"
                            >
                                🏪 Buka Toko
                            </button>
                        ) : user.role === 'penjual' ? (
                            <Link 
                                to="/add-product" 
                                className="text-sm font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 decoration-none"
                            >
                                + Upload
                            </Link>
                        ) : null}
                        {/* --------------------------------------------- */}

                        {/* Keranjang */}
                        <Link to="/cart" className="relative group">
                            <span className="text-2xl text-gray-500 group-hover:text-green-600 transition">🛒</span>
                        </Link>

                        {/* User Profile / Login */}
                        {!user.name ? (
                            <div className="flex gap-2">
                                <Link to="/login" className="px-4 py-2 text-green-600 font-bold border border-green-600 rounded-lg hover:bg-green-50 transition text-sm">Masuk</Link>
                                <Link to="/register" className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-sm">Daftar</Link>
                            </div>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">{user.name.charAt(0).toUpperCase()}</div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs text-gray-500">Halo,</p>
                                        <p className="text-sm font-bold text-gray-800 max-w-[100px] truncate">{user.name}</p>
                                    </div>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-100 p-4 transform transition-all duration-200 origin-top-right">
                                        <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 rounded-lg">
                                            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">{user.name.charAt(0).toUpperCase()}</div>
                                            <div><p className="font-bold text-gray-800">{user.name}</p><p className="text-xs text-green-600 font-semibold">Member Silver</p></div>
                                        </div>
                                        <hr className="border-gray-100 mb-2"/>
                                        <div className="flex flex-col gap-1">
                                            {user.role === 'penjual' && (
                                                <Link to="/my-products" className="px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 text-sm font-medium flex justify-between items-center">
                                                    📦 Toko Saya <span className="text-green-600 text-xs bg-green-100 px-2 py-0.5 rounded">Penjual</span>
                                                </Link>
                                            )}
                                            <Link to="/orders" className="px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 text-sm font-medium">🛍️ Daftar Pesanan</Link>
                                        </div>
                                        <hr className="border-gray-100 my-2"/>
                                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-md text-sm font-bold flex items-center gap-2">🚪 Keluar</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* CONTENT AREA */}
            <div className="w-[90%] mx-auto pb-10 pt-12">
                
                {/* Grid Produk */}
                {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow"><p className="text-gray-500 text-lg">Belum ada produk tersedia.</p></div>
                ) : (
                    // --- PERBAIKAN GRID: lg:grid-cols-6 (Laptop Standar = 6 Kolom) ---
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition duration-300 transform hover:-translate-y-1 flex flex-col h-full group">
                                <Link to={`/product/${product.id}`} className="block cursor-pointer relative">
                                    {/* GAMBAR TETAP CROP (object-cover) AGAR RAPI */}
                                    <img 
                                        src={product.foto_barang} 
                                        alt={product.nama_barang} 
                                        className="w-full h-40 object-cover group-hover:opacity-90 transition" 
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }} 
                                    />
                                    {product.stok_barang <= 0 && (<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">HABIS</span></div>)}
                                </Link>
                                <div className="p-3 flex flex-col flex-1">
                                    <Link to={`/product/${product.id}`} className="no-underline">
                                        <h3 
                                            className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug hover:text-green-600 transition min-h-[40px]"
                                            title={product.nama_barang}
                                        >
                                            {product.nama_barang}
                                        </h3>
                                    </Link>
                                    
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-2">{product.kategori}</p>
                                    
                                    <div className="flex flex-col gap-1 mb-2">
                                        <span className="text-gray-800 font-bold text-base">{formatRupiah(product.harga_barang)}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Stok {product.stok_barang}</span>
                                            <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{product.user ? product.user.name : 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}