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

        // Event Listener untuk menutup dropdown
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

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(num);

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

                    {/* Area Kanan Navbar (FITUR PINDAHAN ADA DI SINI) */}
                    <div className="flex items-center gap-4">
                        
                        {/* 1. Tombol Dashboard (Pindah ke sini) */}
                        <Link to="/" className="text-gray-500 hover:text-blue-600 font-medium px-4 py-2 transition decoration-none">
                            Dashboard
                        </Link>

                        {/* 2. Tombol Tambah Produk (Pindah ke sini) */}
                        <Link to="/add-product" className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2 decoration-none">
                            <span>+</span> Tambah Produk
                        </Link>

                        <Link to="/seller-orders" className="text-gray-600 hover:text-blue-600 font-bold px-3 py-2 transition decoration-none border-l border-gray-300 ml-2">
                           Pesanan Masuk
                        </Link>

                        {/* Separator Kecil */}
                        <div className="h-6 w-px bg-gray-300 mx-2"></div>

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
            <div className="max-w-6xl mx-auto px-4">
                
                {/* Judul Halaman (Tombol lama sudah dihapus) */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Produk Saya</h1>
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
                                
                                {/* Gambar */}
                                <div className="w-full sm:w-32 h-32 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                    <img 
                                        src={product.foto_barang} 
                                        alt={product.nama_barang} 
                                        className="w-full h-full object-cover"
                                        onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 w-full text-center sm:text-left">
                                    <h3 
                                        className="text-xl font-bold text-gray-800 mb-1 line-clamp-2 break-all leading-tight"
                                        title={product.nama_barang} // Tooltip agar nama full muncul saat di-hover
                                    >
                                        {product.nama_barang}
                                    </h3>
                                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded uppercase font-bold mb-2">{product.kategori}</span>
                                    <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500 justify-center sm:justify-start">
                                        <p className="text-blue-600 font-bold text-lg">{formatRupiah(product.harga_barang)}</p>
                                        <span className="hidden sm:block">|</span>
                                        <p>Stok: <span className="font-bold text-gray-800">{product.stok_barang}</span></p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Dibuat: {new Date(product.created_at).toLocaleDateString()}</p>
                                </div>

                                {/* Aksi */}
                                <div className="flex gap-3">
                                    <Link 
                                        to={`/edit-product/${product.id}`} 
                                        className="px-5 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 transition decoration-none flex items-center gap-2"
                                    >
                                        ✏️ Edit
                                    </Link>
                                    <button 
                                        onClick={() => deleteProduct(product.id)}
                                        className="px-5 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition flex items-center gap-2"
                                    >
                                        🗑️ Hapus
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}