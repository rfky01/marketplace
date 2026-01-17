import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState({});

    // 1. Cek Login & Ambil Data
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
            fetchProducts();
        }
    }, []);

    // 2. Fungsi Ambil Data Produk
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

    // 3. FUNGSI BELI (Fitur Lama)
    const handleBuy = async (productId) => {
        if(!confirm("Apakah Anda yakin ingin membeli barang ini?")) return;

        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    items: [{ produk_id: productId, jumlah: 1 }]
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Pembelian Berhasil!\nKode Invoice: ${data.data.invoice_code}`);
                fetchProducts(); // Refresh stok
            } else {
                alert("Gagal Membeli: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error("Error buying product:", error);
        }
    };

    // 4. FUNGSI BUKA TOKO (Fitur C2C Baru)
    const handleOpenShop = async () => {
        if(!confirm("Apakah Anda ingin mulai berjualan dan membuka toko?")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/open-shop', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                alert("Selamat! Toko Anda aktif.");
                
                // Update data user di local storage & state agar tombol berubah otomatis
                const updatedUser = { ...user, role: 'penjual' };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else {
                alert("Gagal: " + data.message);
            }
        } catch (error) {
            console.error("Error opening shop:", error);
        }
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
        <div className="min-h-screen bg-gray-100">
            {/* NAVBAR */}
            <nav className="bg-white shadow-md p-4 mb-6 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-blue-600">Marketplace C2C</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-700 hidden sm:block">Halo, <b>{user.name}</b></span>
                        <Link to="/orders" className="text-blue-600 hover:text-blue-800 font-medium">Riwayat Pesanan</Link>
                        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto p-4">
                {/* SECTION HEADER & AKSI C2C */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800">Produk Terbaru</h2>
                    
                    {/* LOGIKA TOMBOL BERDASARKAN ROLE */}
                    {user.role === 'pembeli' ? (
                        <button 
                            onClick={handleOpenShop}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center gap-2"
                        >
                            🏪 Buka Toko Gratis
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                ✓ Akun Penjual
                            </span>
                            <Link to="/add-product" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2 decoration-none">
                                + Upload Produk
                            </Link>
                        </div>
                    )}
                </div>
                
                {/* GRID PRODUK */}
                {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <p className="text-gray-500 text-lg">Belum ada produk tersedia.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300 transform hover:-translate-y-1">
                                {/* Gambar */}
                                <div className="relative">
                                    <img 
                                        src={product.foto_barang} 
                                        alt={product.nama_barang} 
                                        className="w-full h-48 object-cover"
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=No+Image"; }}
                                    />
                                    {product.stok_barang <= 0 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg bg-red-600 px-3 py-1 rounded">HABIS</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{product.nama_barang}</h3>
                                    <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide">{product.kategori}</p>
                                    
                                    <div className="flex justify-between items-center mb-4 pt-2 border-t">
                                        <span className="text-blue-600 font-bold text-lg">{formatRupiah(product.harga_barang)}</span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${product.stok_barang > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            Stok: {product.stok_barang}
                                        </span>
                                    </div>

                                    <button 
                                        onClick={() => handleBuy(product.id)}
                                        disabled={product.stok_barang <= 0}
                                        className={`w-full font-bold py-2 rounded transition shadow-md ${
                                            product.stok_barang > 0 
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {product.stok_barang > 0 ? 'Beli Sekarang' : 'Stok Habis'}
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