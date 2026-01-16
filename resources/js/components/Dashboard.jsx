import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState({});

    // Cek Login & Ambil Data
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

    // Fungsi Ambil Data Produk
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

    // --- FUNGSI BARU: BELI SEKARANG ---
    const handleBuy = async (productId) => {
        // 1. Konfirmasi Pembelian
        if(!confirm("Apakah Anda yakin ingin membeli barang ini?")) return;

        const token = localStorage.getItem('token');
        console.log("Token yang dikirim:", token);
        
        // 2. Siapkan Data (Sesuai format OrderController Anda)
        const payload = {
            items: [
                {
                    produk_id: productId,
                    jumlah: 1 // Default beli 1 dulu
                }
            ]
        };

        try {
            // 3. Kirim Request ke API Laravel
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Wajib pakai Token
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            // 4. Cek Hasil
            if (response.ok) {
                alert(`Pembelian Berhasil!\nKode Invoice: ${data.data.invoice_code}`);
                
                // Refresh daftar produk agar Stok berkurang di tampilan
                fetchProducts(); 
            } else {
                alert("Gagal Membeli: " + (data.message || "Terjadi kesalahan"));
            }

        } catch (error) {
            console.error("Error buying product:", error);
            alert("Terjadi kesalahan sistem.");
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
                    <h1 className="text-xl font-bold text-blue-600">Marketplace</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-700 hidden sm:block">Halo, <b>{user.name}</b></span>
                        
                        {/* LINK KE HALAMAN ORDER */}
                        <Link to="/orders" className="text-blue-600 hover:text-blue-800 font-medium">
                            Riwayat Pesanan
                        </Link>

                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition shadow">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* CONTENT */}
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Produk Terbaru</h2>
                
                {products.length === 0 ? (
                    <div className="text-center py-20">
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
                                    {/* Badge Stok Habis */}
                                    {product.stok_barang <= 0 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-bold text-lg bg-red-600 px-3 py-1 rounded">HABIS</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{product.nama_barang}</h3>
                                    <p className="text-gray-500 text-xs mb-3 uppercase tracking-wide">{product.kategori}</p>
                                    
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                        {product.deskripsi}
                                    </p>
                                    
                                    <div className="flex justify-between items-center mb-4 pt-2 border-t">
                                        <span className="text-blue-600 font-bold text-lg">{formatRupiah(product.harga_barang)}</span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${product.stok_barang > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            Stok: {product.stok_barang}
                                        </span>
                                    </div>

                                    {/* TOMBOL BELI */}
                                    <button 
                                        onClick={() => handleBuy(product.id)}
                                        disabled={product.stok_barang <= 0} // Matikan tombol jika stok 0
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