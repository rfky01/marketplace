import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SellerNavActions from './SellerNavActions';
import iconKosong from './asset/kosong.png'

export default function MyProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});
    
    // --- STATE NAVBAR ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- STATE TOAST (NOTIFIKASI ATAS) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- STATE MODAL DELETE (POPUP TENGAH) ---
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: null });

    const navigate = useNavigate();

    // --- EFFECT: AUTO-CLOSE TOAST ---
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const fetchMyProducts = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // PERBAIKAN: Gunakan endpoint '/api/my-products' bukan '/api/produk'
            const response = await fetch('http://127.0.0.1:8000/api/my-products', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                // Backend 'userIndex' sekarang pakai get(), jadi data.data langsung Array
                setProducts(data.data);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error("Gagal ambil produk:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (userData) setUser(JSON.parse(userData));

        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
        }

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
                console.error("Gagal refresh data user:", error);
            }
        };     

        fetchUserData();
        fetchMyProducts();

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

    // --- 1. FUNGSI MEMBUKA POPUP DELETE ---
    const openDeleteModal = (id) => {
        setDeleteModal({ isOpen: true, productId: id });
    };

    // --- 2. FUNGSI EKSEKUSI DELETE (DIJALANKAN SAAT KLIK "YA") ---
    const confirmDeleteProduct = async () => {
        const id = deleteModal.productId;
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if(response.ok){
                // Tutup Modal
                setDeleteModal({ isOpen: false, productId: null });
                // Tampilkan Toast Sukses
                setToast({ show: true, message: "Produk berhasil dihapus", type: 'success' });
                // Refresh Data
                fetchMyProducts();
            } else {
                setDeleteModal({ isOpen: false, productId: null });
                setToast({ show: true, message: "Gagal menghapus produk", type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setDeleteModal({ isOpen: false, productId: null });
            setToast({ show: true, message: "Terjadi kesalahan sistem", type: 'error' });
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

    const getProductImage = (product) => {
        if (Array.isArray(product.foto_barang) && product.foto_barang.length > 0) {
            return `http://127.0.0.1:8000/storage/${product.foto_barang[0]}`;
        }
        if (typeof product.foto_barang === 'string' && product.foto_barang) {
            return product.foto_barang.startsWith('http') 
                ? product.foto_barang 
                : `http://127.0.0.1:8000/storage/${product.foto_barang}`;
        }
        return "https://via.placeholder.com/300?text=No+Image";
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(num);

    const formatDate = (dateString, withTime = false) => {
        const options = { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            ...(withTime && { hour: '2-digit', minute: '2-digit' }) 
        };
        if (loading) return <div className="p-10 text-center">Memuat produk Anda...</div>;
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-blue-50 w-full font-sans pb-20">
            
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto min-h-[4rem] flex flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3 py-2 sm:px-4 lg:px-8 md:h-16 md:flex-nowrap">
                    <div className="flex min-w-0 items-center gap-4 lg:gap-8">
                        <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600 tracking-tight decoration-none whitespace-nowrap">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>

                    <div className="order-3 flex w-full items-center justify-end gap-1 md:order-none md:w-auto md:gap-3">
                        <SellerNavActions />

                        <div className="hidden sm:block h-6 w-px bg-gray-300 mx-1"></div>

                        <Link to="/" className="text-gray-500 hover:text-blue-600 hover:bg-gray-100 font-medium px-3 sm:px-4 py-2 rounded-lg transition decoration-none">
                            Dashboard
                        </Link>

                        <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition border border-transparent hover:border-gray-200">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-200">
                                        {getProfilePhoto() ? (
                                            <img 
                                                src={getProfilePhoto()} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs text-gray-500">Halo,</p>
                                        <p className="text-sm font-bold text-gray-800 max-w-[100px] truncate">{user.name}</p>
                                    </div>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-fade-in-down">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                                                {getProfilePhoto() ? (
                                                    <img 
                                                        src={getProfilePhoto()} 
                                                        alt="Profile" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold bg-blue-50">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                                <p className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block">Penjual</p>
                                            </div>
                                        </div>

                                        <div className="py-2">
                                            <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2">
                                                Daftar Pesanan
                                            </Link>
                                        </div>

                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition">
                                                Keluar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4">
                
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Produk Saya</h1>
                    <div className="text-gray-500 text-sm">Total: {products.length} Produk</div>
                </div>

                {products.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                        <img 
                        src={iconKosong} 
                        alt="kosong" 
                        className="w-25 h-20 object-contain opacity-60 group-hover:opacity-100 transition duration-200"
                        />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada produk</h2>
                        <p className="text-gray-500 mb-6">Mulai jualan dengan menambahkan produk pertamamu!</p>
                        <Link to="/add-product" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition shadow-lg decoration-none">
                            + Tambah Produk
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-center gap-6 transition hover:shadow-md">
                                
                                <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                    <img 
                                        src={getProductImage(product)} 
                                        alt={product.nama_barang} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }}
                                    />
                                </div>

                                <div className="flex-1 w-full text-center sm:text-left min-w-0 pr-4">
                                    <h3 
                                        className="text-xl font-bold text-gray-800 mb-1 line-clamp-2 break-all leading-tight"
                                        title={product.nama_barang}
                                    >
                                        {product.nama_barang}
                                    </h3>
                                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded uppercase font-bold mb-2">{product.kategori}</span>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500 justify-center sm:justify-start">
                                        <p className="text-blue-600 font-bold text-lg">{formatRupiah(product.harga_barang)}</p>
                                        <span className="hidden sm:block">|</span>
                                        <p>Stok: <span className="font-bold text-gray-800">{product.stok_barang}</span></p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center sm:items-end gap-3 flex-shrink-0">
                                    
                                    <div className="flex gap-3">
                                        <Link 
                                            to={`/edit-product/${product.id}`} 
                                            className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 transition decoration-none flex items-center gap-2 shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                            Edit
                                        </Link>

                                        <button 
                                            onClick={() => openDeleteModal(product.id)}
                                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition flex items-center gap-2 shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            Hapus
                                        </button>
                                    </div>

                                    <div className="text-xs text-gray-400 text-center sm:text-right">
                                        <div className="mb-1">
                                            Dibuat: {formatDate(product.created_at)}
                                        </div>
                                        <div className="font-bold text-gray-600 mb-1">
                                            {product.user?.name || user.name || "Penjual"}
                                        </div>
                                        {product.created_at !== product.updated_at && (
                                            <div className="text-orange-500 font-medium">
                                                Diedit: {formatDate(product.updated_at, true)}
                                            </div>
                                        )}
                                    </div>

                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

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

            {/* --- MODAL DELETE (POPUP TENGAH) --- */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform scale-100 transition-all">
                        
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
                            <span className="text-3xl font-bold">!</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi Hapus</h3>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            Yakin ingin menghapus produk ini? <br/> Produk akan dihapus selamanya!!
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeleteModal({ isOpen: false, productId: null })}
                                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition shadow-sm"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={confirmDeleteProduct}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg"
                            >
                                Ya, Hapus
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
