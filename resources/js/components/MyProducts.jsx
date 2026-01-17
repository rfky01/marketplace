import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function MyProducts() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchMyProducts();
        }
    }, []);

    const fetchMyProducts = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/my-products', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error("Error fetching my products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        if(!confirm("Yakin ingin menghapus produk ini?")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            const data = await response.json(); 

            if (response.ok) {
                alert("Produk berhasil dihapus!");
                fetchMyProducts(); 
            } else {
                alert("Gagal: " + (data.message || "Terjadi kesalahan sistem"));
            }

        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(num);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="container mx-auto max-w-5xl"> 
                
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800">Manajemen Produk Saya</h2>
                    <div className="flex gap-3">
                        <Link to="/add-product" className="bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm shadow hover:bg-blue-700 decoration-none flex items-center gap-2">
                            <span>+</span> Tambah
                        </Link>
                        <Link to="/" className="bg-gray-500 text-white font-bold py-2 px-4 rounded text-sm shadow hover:bg-gray-600 decoration-none">
                            Dashboard
                        </Link>
                    </div>
                </div>

                {/* CONTENT */}
                {loading ? (
                    <p className="text-center text-gray-500">Memuat produk...</p>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow">
                        <p className="text-gray-500 text-lg mb-4">Anda belum memiliki produk.</p>
                        <Link to="/add-product" className="text-blue-600 font-bold hover:underline">Mulai Jualan Sekarang</Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition">
                                
                                {/* 1. GAMBAR (Kiri) */}
                                <img 
                                    src={product.foto_barang} 
                                    alt={product.nama_barang} 
                                    className="w-full sm:w-24 h-24 object-cover rounded-md border border-gray-100" 
                                    onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                />
                                
                                {/* 2. INFO PRODUK (Tengah) - Saya hapus duplikatnya di sini */}
                                <div className="flex-1 w-full text-center sm:text-left">
                                    <h3 
                                        className="font-bold text-lg text-gray-800 line-clamp-2 break-all overflow-hidden"
                                        title={product.nama_barang}
                                    >
                                        {product.nama_barang}
                                    </h3>
                                    <p className="text-xs text-gray-500 uppercase mb-2">{product.kategori}</p>
                                    
                                    <div className="flex items-center justify-center sm:justify-start gap-4 text-sm mb-2">
                                        <span className="text-blue-600 font-bold">{formatRupiah(product.harga_barang)}</span>
                                        <span className="text-gray-400">|</span>
                                        <span className={`px-2 py-0.5 rounded text-xs border ${product.stok_barang > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            Stok: {product.stok_barang}
                                        </span>
                                    </div>

                                    {/* INFO TIMESTAMP */}
                                    <div className="text-xs text-gray-400 flex flex-col sm:flex-row gap-1 sm:gap-4 mt-2 border-t pt-2">
                                        <span className="flex items-center gap-1">
                                            📅 Dibuat: {new Date(product.created_at).toLocaleDateString('id-ID')}
                                        </span>
                                        
                                        {/* Hanya muncul jika pernah diedit */}
                                        {product.updated_by && product.updater && (
                                            <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 rounded w-fit">
                                                update by: {product.updater.name} ({new Date(product.updated_at).toLocaleDateString('id-ID')})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* 3. TOMBOL AKSI (Kanan) */}
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Link 
                                        to={`/edit-product/${product.id}`}
                                        className="flex-1 sm:flex-none bg-yellow-400 text-white px-4 py-2 rounded font-medium hover:bg-yellow-500 transition text-sm flex items-center justify-center gap-1 decoration-none"
                                    >
                                        ✏️ Edit
                                    </Link>

                                    <button 
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 sm:flex-none bg-red-100 text-red-600 px-4 py-2 rounded font-medium hover:bg-red-200 transition text-sm border border-red-200 flex items-center justify-center gap-1"
                                    >
                                        🗑 Hapus
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