import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChatDropdown from './ChatDropdown';
import ProductImageSlider from './ProductImageSlider';
import Pagination from './Pagination'; // Pastikan file ini sudah dibuat!

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

    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

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

        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        
        // Fetch Produk dipanggil DISINI SAJA (Hapus yang duplikat)
        fetchProducts(currentPage);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [currentPage]); // Dependency currentPage memastikan fetch ulang saat ganti halaman

    const fetchProducts = async (page) => {
        setLoading(true);
        try {
            // Panggil API dengan parameter ?page=...
            const response = await fetch(`http://127.0.0.1:8000/api/produk?page=${page}`);
            const result = await response.json();

            if (result.success) {
                // --- [PERBAIKAN LOGIKA DISINI] ---
                // Cek apakah data dari backend berbentuk Pagination (objek dengan key 'data') 
                // ATAU Array biasa. Ini mencegah produk hilang jika backend salah format.
                if (result.data && Array.isArray(result.data.data)) {
                    // Jika Format Pagination
                    setProducts(result.data.data);
                    setCurrentPage(result.data.current_page);
                    setLastPage(result.data.last_page);
                } else if (Array.isArray(result.data)) {
                    // Jika Format Array Biasa (Fallback)
                    setProducts(result.data);
                } else {
                    setProducts([]);
                }
            }
        } catch (error) {
            console.error("Gagal ambil produk:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- State Loading didefinisikan disini agar tidak error ---
    const [loading, setLoading] = useState(true);

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
    
    // Ambil Kategori Unik dari data produk yang ada
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
                
                setToast({ 
                    show: true, 
                    message: "Selamat! Toko Anda aktif. Silakan mulai upload produk.", 
                    type: 'success' 
                });

            } else { 
                setIsShopLoading(false);
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
        <div className="min-h-screen bg-blue-50 w-full font-sans pb-20">
            
            <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
                <div className="w-[90%] mx-auto h-16 flex items-center justify-between px-4">
                    
                    <div className="flex items-center gap-4 lg:gap-6 flex-1">
                        <Link to="/" className="text-2xl font-bold text-blue-900 tracking-tight">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                        
                        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full max-w-[400px] border border-gray-200 focus-within:border-blue-900 transition">
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

                    <div className="flex items-center gap-6 flex-shrink-0 ml-6">
                        {user.role === 'pembeli' ? (
                            <button 
                                onClick={() => setShowShopModal(true)} 
                                className="text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 decoration-none"
                            >
                                Buka Toko
                            </button>
                        ) : user.role === 'penjual' ? (
                            <Link 
                                to="/add-product" 
                                className="text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1 decoration-none whitespace-nowrap flex-shrink-0"
                            >
                                + Upload
                            </Link>
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
                                                    <Link to="/my-products" className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-3 transition">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 1.138a3.002 3.002 0 012.28-.738h9.804a3.002 3.002 0 012.28.738l3.12 3.892a3.004 3.004 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                                                        </svg>
                                                        <span className="flex-1">Toko Saya</span>
                                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">Penjual</span>
                                                    </Link>
                                                )}
                                                {user.role === 'penjual' && (
                                                    <Link to="/seller-orders" className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-3 transition">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                        </svg>
                                                        <span className="flex-1">Pesanan Masuk</span>
                                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">Penjual</span>
                                                    </Link>
                                                )}
                                                <Link 
                                                    to="/orders" 
                                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-3 transition"
                                                    title="Daftar Pesanan"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
                                                        <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 1.5h-3c.621 0 1.129.504 1.243 1.136.014.077.037.156.07.236h1.374c.033-.08.056-.159.07-.236.114-.632.622-1.136 1.243-1.136z" clipRule="evenodd" />
                                                        <path fillRule="evenodd" d="M3.75 15a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm0 4.5a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm0-9a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                                    </svg>

                                                    <span className="flex-1">Daftar Pesanan</span>
                                                </Link>

                                            </div>
                                            <hr className="border-gray-100 my-2"/>
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                            </svg>
                                            Keluar
                                        </button>
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

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                    </div>
                ) : processedProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <img 
                            src={iconSearch} 
                            alt="Not Found" 
                            className="w-16 h-16 mx-auto mb-4 opacity-50 object-contain"
                        />
                        <p className="text-gray-500 text-lg">Produk tidak ditemukan.</p>
                        
                        {/* --- KOMPONEN PAGINATION TETAP MUNCUL AGAR BISA KEMBALI --- */}
                        <div className="mt-12 border-t border-gray-200 pt-6">
                            <Pagination 
                                currentPage={currentPage} 
                                lastPage={lastPage} 
                                onPageChange={(page) => setCurrentPage(page)} 
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {processedProducts.map((product) => {
                                const ulasan = product.ulasan || [];
                                const ratingCount = ulasan.length;
                                const totalRating = ulasan.reduce((acc, curr) => acc + parseInt(curr.rating), 0);
                                const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

                                return (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition duration-300 transform hover:-translate-y-1 flex flex-col h-full group">
                                        <Link to={`/product/${product.slug}`} className="block cursor-pointer relative">
                                            <ProductImageSlider 
                                                images={product.foto_barang} 
                                                alt={product.nama_barang} 
                                            />
                                            {product.stok_barang <= 0 && (<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"><span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">HABIS</span></div>)}
                                        </Link>
                                        <div className="p-3 flex flex-col flex-1">
                                            <Link to={`/product/${product.slug}`} className="block cursor-pointer relative">
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

                        {/* --- KOMPONEN PAGINATION --- */}
                        <div className="mt-12 border-t border-gray-200 pt-6">
                            <Pagination 
                                currentPage={currentPage} 
                                lastPage={lastPage} 
                                onPageChange={(page) => setCurrentPage(page)} 
                            />
                        </div>
                    </>
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