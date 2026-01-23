import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChatDropdown from './ChatDropdown';
import iconKeranjang from './asset/keranjang.png'
import iconPesanan from './asset/pesan.png'
import iconSearch from './asset/search.png'
import iconToko from './asset/toko.png'

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

    const [showShopModal, setShowShopModal] = useState(false);
    const [isShopLoading, setIsShopLoading] = useState(false);
    
    // --- STATE TOAST NOTIFICATION ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const dropdownRef = useRef(null);

    // --- EFFECT: AUTO-CLOSE TOAST ---
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));
        }

        fetchProducts();

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
                setProducts(Array.isArray(data.data) ? data.data : []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
        }
    };

    const getProcessedProducts = () => {
        if (!products || !Array.isArray(products)) return [];

        let result = products.filter((product) => {
            if (!product) return false;

            const pName = (product.nama_barang || "").toLowerCase();
            const pCat = (product.kategori || "").toLowerCase();
            const sTerm = (searchTerm || "").toLowerCase();
            const sCat = selectedCategory || "";

            const matchSearch = sTerm === "" || pName.includes(sTerm) || pCat.includes(sTerm);
            const matchCategory = sCat === "" || product.kategori === sCat;
            
            return matchSearch && matchCategory;
        });

        if (sortOrder === 'lowest') {
            result.sort((a, b) => (a.harga_barang || 0) - (b.harga_barang || 0));
        } else if (sortOrder === 'highest') {
            result.sort((a, b) => (b.harga_barang || 0) - (a.harga_barang || 0));
        }

        return result;
    };

    const processedProducts = getProcessedProducts();
    
    const uniqueCategories = products && Array.isArray(products) 
        ? [...new Set(products.map(p => p.kategori).filter(k => k))] 
        : [];

    const executeOpenShop = async () => {
        setIsShopLoading(true); 
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/open-shop', {
                method: 'POST',
                headers: {'Authorization': `Bearer ${token}`, 'Accept': 'application/json'}
            });
            const data = await response.json();
            
            if (response.ok) {
                const updatedUser = { ...user, role: 'penjual' };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                
                setIsShopLoading(false);
                setShowShopModal(false); 
                
                // --- GANTI ALERT DENGAN TOAST ---
                setToast({ 
                    show: true, 
                    message: "Selamat! Toko Anda aktif. Silakan mulai upload produk.", 
                    type: 'success' 
                });

            } else { 
                setIsShopLoading(false);
                // --- GANTI ALERT DENGAN TOAST ERROR ---
                setToast({ 
                    show: true, 
                    message: "Gagal: " + (data.message || "Terjadi kesalahan"), 
                    type: 'error' 
                });
            }
        } catch (error) { 
            setIsShopLoading(false);
            console.error(error);
            setToast({ 
                show: true, 
                message: "Terjadi kesalahan koneksi", 
                type: 'error' 
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatRupiah = (number) => {
        if (number === null || number === undefined) return "Rp 0";
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const getProfilePhoto = () => {
        if (user.profile_photo) {
            return `http://127.0.0.1:8000/storage/${user.profile_photo}`;
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-100 w-full font-sans">
            
            <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
                <div className="w-[90%] mx-auto h-16 flex items-center justify-between px-4">
                    
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-2xl font-bold text-blue-900 tracking-tight">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                        
                        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-[400px] border border-gray-200 focus-within:border-blue-900 transition">
                            <img src={iconSearch} alt="Search" className="w-8 h-8 object-contain opacity-50 mr-2" />
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
                    </div>

                    <div className="flex items-center gap-2">
                        {user.role === 'pembeli' ? (
                            <button 
                                onClick={() => setShowShopModal(true)} 
                                className="text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 decoration-none"
                            >
                                Buka Toko
                            </button>
                        ) : user.role === 'penjual' ? (
                            <Link to="/add-product" className="text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 decoration-none">+ Upload</Link>
                        ) : null}

                        <Link to="/keranjang" className="relative group flex items-center">
                            <img 
                                src={iconKeranjang} 
                                alt="keranjang" 
                                className="w-10 h-10 object-contain opacity-60 group-hover:opacity-100 transition duration-200"
                            />
                        </Link>

                         <ChatDropdown />

                        {!user.name ? (
                            <div className="flex gap-2">
                                <Link to="/login" className="px-4 py-2 text-blue-900 font-bold border border-blue-900 rounded-lg hover:bg-blue-50 transition text-sm">Masuk</Link>
                                <Link to="/register" className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition text-sm">Daftar</Link>
                            </div>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-200">
                                        {getProfilePhoto() ? (
                                            <img 
                                                src={getProfilePhoto()} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs text-gray-500">Halo,</p>
                                        <p className="text-sm font-bold text-gray-800 max-w-[100px] truncate">{user.name}</p>
                                    </div>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-100 p-4 transform transition-all duration-200 origin-top-right">
                                            <Link to="/profile" className="flex items-center gap-3 mb-4 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer decoration-none">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-100 bg-white shadow-sm flex-shrink-0">
                                                    {getProfilePhoto() ? (
                                                        <img 
                                                                src={getProfilePhoto()} 
                                                                alt="Profile" 
                                                                className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-blue-200 flex items-center justify-center text-blue-900 font-bold text-lg">
                                                                {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-800 truncate">{user.name}</p>
                                                    <p className="text-xs text-blue-600 font-medium">Lihat Profil</p>
                                                </div>
                                            </Link>
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

            <div className="w-[90%] mx-auto pb-10 pt-12">
                
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

                {processedProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <img 
                            src={iconSearch} 
                            alt="Not Found" 
                            className="w-16 h-16 mx-auto mb-4 opacity-50 object-contain"
                        />
                        <p className="text-gray-500 text-lg">Produk tidak ditemukan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {processedProducts.map((product) => {
                            const ulasan = product.ulasan || [];
                            const ratingCount = ulasan.length;
                            const totalRating = ulasan.reduce((acc, curr) => acc + parseInt(curr.rating), 0);
                            const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

                            return (
                                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition duration-300 transform hover:-translate-y-1 flex flex-col h-full group">
                                    <Link to={`/product/${product.id}`} className="block cursor-pointer relative">
                                        <img 
                                            src={
                                                Array.isArray(product.foto_barang) 
                                                ? `http://127.0.0.1:8000/storage/${product.foto_barang[0]}`
                                                : product.foto_barang
                                            } 
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
                                        
                                        <div className="flex items-center gap-1 mb-2">
                                            <span className="text-yellow-400 text-xs">★</span>
                                            <span className="text-xs font-bold text-gray-600">{avgRating > 0 ? avgRating : '0.0'}</span>
                                            <span className="text-[10px] text-gray-400">({ratingCount})</span>
                                        </div>

                                        <div className="flex items-center gap-1 mt-auto">
                                            <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">Stok {product.stok_barang}</span>
                                            <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{product.user ? product.user.name : 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL KONFIRMASI BUKA TOKO */}
            {showShopModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform scale-100 transition-transform duration-300">
                        
                        <div className="w-21 h-21 flex items-center justify-center mx-auto mb-4 p-4">
                             <img src={iconToko} alt="Buka Toko" className="object-contain drop-shadow-md"/>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Buka Toko?</h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            Apakah Anda yakin ingin mulai berjualan? Akun Anda akan diaktifkan sebagai Penjual.
                        </p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowShopModal(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition">
                                Batal
                            </button>
                            <button 
                                onClick={executeOpenShop}
                                disabled={isShopLoading}
                                className="flex-1 py-2.5 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isShopLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Memproses...
                                    </>
                                ) : ( "Ya, Buka Toko" )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOAST NOTIFICATION (POJOK KANAN ATAS) --- */}
            {toast.show && (
                <div className="fixed top-24 right-4 z-[200] animate-slide-in">
                    <div className={`shadow-xl rounded-lg border-l-4 p-4 flex items-center gap-3 min-w-[300px] bg-white
                        ${toast.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <span className="font-bold text-lg">
                                {toast.type === 'error' ? '!' : '✓'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm">
                                {toast.type === 'error' ? 'Gagal!' : 'Berhasil!'}
                            </h4>
                            <p className="text-gray-600 text-xs">{toast.message}</p>
                        </div>
                        <button 
                            onClick={() => setToast({ ...toast, show: false })} 
                            className="text-gray-400 hover:text-gray-600 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}