import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState({});
    
    // STATE UNTUK DROPDOWN MENU PROFIL
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // STATE PENCARIAN & KATEGORI
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    
    // STATE SORTIR HARGA
    const [sortOrder, setSortOrder] = useState(''); 
    
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

    // --- LOGIKA FILTER + SORTIR PRODUK ---
    const getProcessedProducts = () => {
        // 1. Filter (Search & Kategori)
        let result = products.filter((product) => {
            const matchSearch = searchTerm === "" || 
                product.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.kategori.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = selectedCategory === "" || product.kategori === selectedCategory;
            return matchSearch && matchCategory;
        });

        // 2. Sortir (Harga)
        if (sortOrder === 'lowest') {
            result.sort((a, b) => a.harga_barang - b.harga_barang);
        } else if (sortOrder === 'highest') {
            result.sort((a, b) => b.harga_barang - a.harga_barang);
        }

        return result;
    };

    const processedProducts = getProcessedProducts();
    const uniqueCategories = [...new Set(products.map(p => p.kategori))];

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
                    
                    {/* 1. LOGO KIRI & SEARCH */}
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-2xl font-bold text-blue-900 tracking-tight">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                        
                        {/* SEARCH BAR */}
                        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-[400px] border border-gray-200 focus-within:border-blue-900 transition">
                            <span className="text-gray-400 mr-2">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Cari di Marketplace Plus" 
                                className="bg-transparent outline-none text-sm w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2">✕</button>
                            )}
                            <div className="h-5 w-px bg-gray-300 mx-2"></div>
                            <select 
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none cursor-pointer max-w-[120px] truncate hover:text-blue-900"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Semua Kategori</option>
                                {uniqueCategories.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* --- DROPDOWN SORTIR HARGA (DIPERKECIL) --- */}
                        <div className="hidden md:block">
                            <select 
                                className="bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg py-2 px-2 w-28 outline-none focus:border-blue-900 transition cursor-pointer hover:bg-gray-50"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option value="">Urutkan</option>
                                <option value="lowest">Termurah</option>
                                <option value="highest">Termahal</option>
                            </select>
                        </div>
                        {/* ----------------------------------------- */}

                    </div>

                    {/* 2. MENU KANAN */}
                    <div className="flex items-center gap-6">
                        {user.role === 'pembeli' ? (
                            <button onClick={handleOpenShop} className="text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 decoration-none">Buka Toko</button>
                        ) : user.role === 'penjual' ? (
                            <Link to="/add-product" className="text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 decoration-none">+ Upload</Link>
                        ) : null}

                        <Link to="/keranjang" className="relative group">
                            <span className="text-2xl text-gray-500 group-hover:text-blue-900 transition">🛒</span>
                        </Link>

                        {!user.name ? (
                            <div className="flex gap-2">
                                <Link to="/login" className="px-4 py-2 text-blue-900 font-bold border border-blue-900 rounded-lg hover:bg-blue-50 transition text-sm">Masuk</Link>
                                <Link to="/register" className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition text-sm">Daftar</Link>
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
                                        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                                            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-bold text-lg">{user.name.charAt(0).toUpperCase()}</div>
                                            <div><p className="font-bold text-gray-800">{user.name}</p><p className="text-xs text-blue-800 font-semibold"></p></div>
                                        </div>
                                        <hr className="border-gray-100 mb-2"/>
                                        <div className="flex flex-col gap-1">
                                            {user.role === 'penjual' && (
                                                <Link to="/my-products" className="px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 text-sm font-medium flex justify-between items-center">
                                                    Toko Saya <span className="text-blue-900 text-xs bg-blue-100 px-2 py-0.5 rounded">Penjual</span>
                                                </Link>
                                            )}
                                            <Link to="/orders" className="px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700 text-sm font-medium">Daftar Pesanan</Link>
                                        </div>
                                        <hr className="border-gray-100 my-2"/>
                                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-md text-sm font-bold flex items-center gap-2">Keluar</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* CONTENT AREA */}
            <div className="w-[90%] mx-auto pb-10 pt-12">
                
                {/* Header Pencarian */}
                {(searchTerm || selectedCategory || sortOrder) && (
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {searchTerm ? <span>Hasil: <span className="text-blue-900">"{searchTerm}"</span></span> : "Daftar Produk"}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {selectedCategory && `Kategori: ${selectedCategory} • `}
                                {processedProducts.length} produk ditemukan
                            </p>
                        </div>
                        <button onClick={() => {setSearchTerm(''); setSelectedCategory(''); setSortOrder('');}} className="text-sm text-red-500 font-bold hover:underline">Reset Filter</button>
                    </div>
                )}

                {/* Grid Produk - Menggunakan processedProducts */}
                {processedProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <p className="text-4xl mb-4">🔍</p>
                        <p className="text-gray-500 text-lg">Produk tidak ditemukan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {processedProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition duration-300 transform hover:-translate-y-1 flex flex-col h-full group">
                                <Link to={`/product/${product.id}`} className="block cursor-pointer relative">
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
                                        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug hover:text-blue-900 transition min-h-[40px]" title={product.nama_barang}>{product.nama_barang}</h3>
                                    </Link>
                                    <div className="mb-1">
                                        <span className="text-gray-800 font-bold text-base">{formatRupiah(product.harga_barang)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-3">{product.kategori}</p>
                                    <div className="flex items-center gap-1 mt-auto">
                                        <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">Stok {product.stok_barang}</span>
                                        <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{product.user ? product.user.name : 'Unknown'}</span>
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