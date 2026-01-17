import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- FITUR BARU: BATALKAN PESANAN ---
    const handleCancelOrder = async (orderId) => {
        if (!confirm("Adakah anda pasti mahu membatalkan pesanan ini? Stok barang akan dikembalikan.")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/cancel-buyer`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();

            if (response.ok) {
                alert("Pesanan berjaya dibatalkan ✅");
                fetchOrders(); // Refresh data supaya status berubah
            } else {
                alert("Gagal: " + (data.message || "Terjadi ralat"));
            }
        } catch (error) {
            console.error(error);
            alert("Ralat sambungan server");
        }
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(num);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium mb-2 inline-block">⬅️ Kembali Belanja</Link>
                        <h1 className="text-3xl font-bold text-gray-800">📦 Riwayat Pesanan</h1>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow text-center">
                        <p className="text-xl text-gray-500 mb-6">Anda belum pernah berbelanja.</p>
                        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                
                                {/* Header Pesanan (Invoice & Status) */}
                                <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">No. Invoice</p>
                                        <p className="text-gray-800 font-bold font-mono text-lg">{order.invoice_code || `INV-${order.id}`}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</p>
                                    </div>
                                    
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'dikirim' ? 'bg-purple-100 text-purple-700' :
                                            order.status === 'selesai' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700' // Untuk status Dibatalkan
                                        }`}>
                                            {order.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {/* List Barang dalam 1 Pesanan */}
                                <div className="p-4">
                                    {order.detail_pesanan && order.detail_pesanan.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 mb-4 last:mb-0 border-b last:border-0 pb-4 last:pb-0 border-gray-100">
                                            {/* Gambar Produk */}
                                            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden border">
                                                <img 
                                                    src={item.produk?.foto_barang} 
                                                    alt="Produk" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}
                                                />
                                            </div>
                                            
                                            {/* Detail Nama & Harga */}
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-800 text-sm sm:text-base line-clamp-1">
                                                    {item.produk?.nama_barang || 'Produk dihapus'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {item.jumlah} barang x {formatRupiah(item.produk?.harga_barang || 0)}
                                                </p>
                                            </div>

                                            {/* Subtotal Item */}
                                            <div className="text-right">
                                                <p className="font-bold text-gray-700 text-sm">
                                                    {formatRupiah((item.produk?.harga_barang || 0) * item.jumlah)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Total Harga & Aksi */}
                                <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
                                    <div>
                                        <span className="text-sm font-bold text-gray-600 block">Total Tagihan</span>
                                        {/* PERBAIKAN: Gunakan grand_total, bukan total_harga */}
                                        <span className="text-xl font-extrabold text-blue-600">
                                            {formatRupiah(order.grand_total || 0)}
                                        </span>
                                    </div>

                                    {/* TOMBOL BATAL (Hanya muncul jika status pending) */}
                                    {order.status === 'pending' && (
                                        <button 
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-200 transition border border-red-200"
                                        >
                                            ✖ Batalkan Pesanan
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}