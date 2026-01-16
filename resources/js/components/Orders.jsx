import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchOrders();
        }
    }, []);

    const fetchOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data); // Asumsi respon API formatnya { data: [...] }
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper untuk warna status
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'accepted': return 'bg-blue-100 text-blue-800';
            case 'dikirim': return 'bg-purple-100 text-purple-800';
            case 'selesai': return 'bg-green-100 text-green-800';
            default: return 'bg-red-100 text-red-800'; // Dibatalkan
        }
    };

    const formatRupiah = (num) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="container mx-auto max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Riwayat Pesanan Saya</h2>
                    <Link to="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
                        Kembali ke Belanja
                    </Link>
                </div>

                {loading ? (
                    <p className="text-center">Memuat data...</p>
                ) : orders.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                        <p className="text-gray-500 mb-4">Anda belum pernah berbelanja.</p>
                        <Link to="/" className="text-blue-600 hover:underline">Mulai Belanja</Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="p-4 font-semibold text-gray-600">Invoice</th>
                                        <th className="p-4 font-semibold text-gray-600">Tanggal</th>
                                        <th className="p-4 font-semibold text-gray-600">Total Harga</th>
                                        <th className="p-4 font-semibold text-gray-600">Status</th>
                                        <th className="p-4 font-semibold text-gray-600">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-mono text-sm text-blue-600">{order.invoice_code}</td>
                                            <td className="p-4 text-gray-700">{order.tanggal}</td>
                                            <td className="p-4 font-bold text-gray-800">{formatRupiah(order.grand_total)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {/* Tombol Cancel hanya muncul jika status Pending */}
                                                {order.status === 'pending' && (
                                                    <button 
                                                        onClick={async () => {
                                                            if(confirm('Batalkan pesanan ini?')) {
                                                                const token = localStorage.getItem('token');
                                                                await fetch(`http://127.0.0.1:8000/api/orders/${order.id}/cancel-buyer`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                fetchOrders(); // Refresh tabel
                                                            }
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                                                    >
                                                        Batalkan
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}