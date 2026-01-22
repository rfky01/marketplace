import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function MyProducts() {
    const [products, setProducts] = useState([]);
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

    const fetchMyProducts = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/my-products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        if(!confirm('Yakin ingin menghapus produk ini?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if(response.ok){
                alert("Produk berhasil dihapus");
                fetchMyProducts();
            } else {
                alert("Gagal menghapus produk");
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

    const getProductImage = (product) => {
        // Cek jika foto berupa Array (Format Baru)
        if (Array.isArray(product.foto_barang) && product.foto_barang.length > 0) {
            return `http://127.0.0.1:8000/storage/${product.foto_barang[0]}`;
        }
        // Cek jika foto berupa String (Format Lama/Fallback)
        if (typeof product.foto_barang === 'string' && product.foto_barang) {
            // Cek apakah sudah ada http-nya atau belum
            return product.foto_barang.startsWith('http') 
                ? product.foto_barang 
                : `http://127.0.0.1:8000/storage/${product.foto_barang}`;
        }
        // Gambar Default jika rusak/kosong
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
        <div className="min-h-screen bg-gray-50 w-full font-sans pb-20">
            
            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
                    
                    {/* Logo Kiri */}
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight decoration-none">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>

                    {/* Area Kanan Navbar */}
                    <div className="flex items-center gap-4">
                        
                        <Link to="/seller-orders" className="text-gray-600 hover:text-blue-600 font-medium px-2 py-2 transition decoration-none">
                           Pesanan Masuk
                        </Link>

                        <Link to="/add-product" className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2 decoration-none mr-2">
                            <span>+</span> Upload
                        </Link>

                        <div className="h-6 w-px bg-gray-300 mx-1"></div>

                        <Link to="/" className="text-gray-500 hover:text-blue-600 font-medium px-4 py-2 transition decoration-none">
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
                    </div>
                </div>
            </nav>

            {/* --- KONTEN UTAMA --- */}
            <div className="max-w-6xl mx-auto px-4">
                
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Produk Saya</h1>
                    <div className="text-gray-500 text-sm">Total: {products.length} Produk</div>
                </div>

                {products.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
                        <div className="text-6xl mb-4">📦</div>
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

                                {/* INFO PRODUK (TENGAH) */}
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

                                {/* BAGIAN KANAN: TOMBOL + INFO WAKTU + PEMBUAT */}
                                <div className="flex flex-col items-center sm:items-end gap-3 flex-shrink-0">
                                    
                                    {/* Tombol Aksi */}
                                    <div className="flex gap-3">
                                        <Link 
                                            to={`/edit-product/${product.id}`} 
                                            className="px-5 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 transition decoration-none flex items-center gap-2"
                                        >
                                            Edit
                                        </Link>
                                        <button 
                                            onClick={() => deleteProduct(product.id)}
                                            className="px-5 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition flex items-center gap-2"
                                        >
                                            Hapus
                                        </button>
                                    </div>

                                    {/* --- INFO PEMBUAT & WAKTU (UPDATE DI SINI) --- */}
                                    <div className="text-xs text-gray-400 text-center sm:text-right">
                                        
                                        {/* Nama Pembuat */}
                                        <div className="mb-1">
                                            Dibuat: {formatDate(product.created_at)}
                                        </div>
                                        <div className="font-bold text-gray-600 mb-1">
                                            {product.user?.name || user.name || "Penjual"}
                                        </div>
                                        
                                        {/* Tanggal Edit (Hanya jika beda) */}
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
        </div>
    );
}