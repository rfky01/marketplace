import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- STATE ---
    const [showBuyModal, setShowBuyModal] = useState(false); // Modal Beli Langsung
    const [showCartModal, setShowCartModal] = useState(false); // Modal Keranjang
    const [quantity, setQuantity] = useState(1); // Jumlah untuk Keranjang

    const [orderForm, setOrderForm] = useState({
        jumlah: 1,
        nama_penerima: '',
        email_penerima: '',
        telepon_penerima: '',
        alamat_pengiriman: '',
        waktu_pengiriman: '',
        metode_pembayaran: 'cod'
    });

    // --- EFFECT ---
    useEffect(() => {
        fetchProductDetail();
        const userData = localStorage.getItem('user');
        if(userData) {
            const parsed = JSON.parse(userData);
            setOrderForm(prev => ({
                ...prev,
                nama_penerima: parsed.name,
                email_penerima: parsed.email,
                telepon_penerima: parsed.phone || '',
                alamat_pengiriman: parsed.address || ''
            }));
        }
    }, [id]);

    // --- FUNGSI-FUNGSI LOGIKA (HARUS DI SINI, SEBELUM RETURN) ---
    
    const fetchProductDetail = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${id}`);
            const data = await response.json();
            if (data.success) {
                setProduct(data.data);
            } else {
                alert("Produk tidak ditemukan");
                navigate('/');
            }
        } catch (error) { console.error("Error:", error); } 
        finally { setLoading(false); }
    };

    // 1. BUKA POPUP KERANJANG
    const openCartModal = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Silakan login dulu");
            navigate('/login');
            return;
        }
        setQuantity(1); // Reset jumlah jadi 1
        setShowCartModal(true);
    };

    // 2. SIMPAN KE KERANJANG (API)
    const confirmAddToCart = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/keranjang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    produk_id: product.id,
                    jumlah: parseInt(quantity)
                })
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(`Berhasil! ${quantity} item masuk keranjang 🛒`);
                setShowCartModal(false);
            } else {
                alert("Gagal: " + data.message);
            }
        } catch (error) { console.error(error); }
    };

    // 3. HANDLE FORM BELI LANGSUNG
    const handleFormChange = (e) => {
        setOrderForm({ ...orderForm, [e.target.name]: e.target.value });
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) { alert("Silakan login untuk membeli"); navigate('/login'); return; }

        if(orderForm.jumlah > product.stok_barang) { alert("Jumlah melebihi stok tersedia!"); return; }

        const payload = {
            items: [{ produk_id: product.id, jumlah: parseInt(orderForm.jumlah) }],
            nama_penerima: orderForm.nama_penerima,
            email_penerima: orderForm.email_penerima,
            telepon_penerima: orderForm.telepon_penerima,
            alamat_pengiriman: orderForm.alamat_pengiriman,
            waktu_pengiriman: orderForm.waktu_pengiriman,
            metode_pembayaran: orderForm.metode_pembayaran
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Pesanan Berhasil!\nInvoice: ${data.data.invoice_code}`);
                setShowBuyModal(false);
                fetchProductDetail(); 
            } else { alert("Gagal: " + (data.message || "Terjadi kesalahan")); }
        } catch (error) { console.error(error); }
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(num);

    // --- TAMPILAN (JSX) ---
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    
    if (!product) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <Link to="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition group font-medium">
                    <span className="mr-2">⬅️</span> Kembali ke Katalog
                </Link>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col">
                    
                    {/* GAMBAR */}
                    <div className="w-full bg-gray-50 flex items-center justify-center p-8 relative h-96 border-b border-gray-100">
                        <img 
                            src={product.foto_barang} 
                            alt={product.nama_barang} 
                            className="w-auto h-full max-w-full object-contain hover:scale-105 transition duration-500 drop-shadow-sm"
                            onError={(e)=>{e.target.src="https://via.placeholder.com/500"}}
                        />
                    </div>

                    {/* INFO */}
                    <div className="p-8 lg:p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-6">
                            <div className="text-4xl font-extrabold text-blue-700">
                                {formatRupiah(product.harga_barang)}
                            </div>
                            <div className={`px-6 py-2 rounded-full text-base font-bold border ${product.stok_barang > 5 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                Stok: {product.stok_barang} Unit
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1 block">Nama Produk</span>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight break-words">
                                {product.nama_barang}
                            </h1>
                            <span className="inline-block mt-3 bg-blue-50 text-blue-600 text-sm font-bold px-3 py-1 rounded border border-blue-100 uppercase">
                                {product.kategori}
                            </span>
                        </div>

                        <div className="mb-8 w-full">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Deskripsi</h3>
                            <div className="prose text-gray-600 p-6 bg-gray-50 rounded-xl border border-gray-100 text-base leading-relaxed whitespace-pre-line break-all break-words w-full">
                                {product.deskripsi}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-8 p-4 rounded-lg border border-gray-100 bg-white shadow-sm w-fit">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">👤</div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Penjual</p>
                                <p className="font-bold text-gray-800 text-base">
                                    {product.user ? product.user.name : 'Penjual'}
                                </p>
                            </div>
                        </div>

                        {/* TOMBOL AKSI */}
                        <div className="flex gap-4 mt-auto">
                            <button 
                                onClick={openCartModal} // Panggil fungsi di atas
                                disabled={product.stok_barang <= 0}
                                className="flex-1 py-4 rounded-xl font-bold text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2"
                            >
                                🛒 + Keranjang
                            </button>

                            <button 
                                onClick={() => setShowBuyModal(true)}
                                disabled={product.stok_barang <= 0}
                                className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-[0.99] flex items-center justify-center gap-2 ${
                                    product.stok_barang > 0 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {product.stok_barang > 0 ? (
                                    <><span>⚡</span> Beli Langsung</>
                                ) : 'Stok Habis'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL 1: KERANJANG --- */}
            {showCartModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Masukkan ke Keranjang</h3>
                            <button onClick={() => setShowCartModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Barang</label>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 font-bold border-r">-</button>
                                <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(product.stok_barang, parseInt(e.target.value) || 1)))} className="w-full text-center outline-none py-3 font-bold" />
                                <button onClick={() => setQuantity(prev => Math.min(product.stok_barang, prev + 1))} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 font-bold border-l">+</button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">Maks: {product.stok_barang}</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowCartModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 font-medium">Batal</button>
                            <button onClick={confirmAddToCart} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow">Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: BELI LANGSUNG --- */}
            {showBuyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                            <div><h3 className="font-bold text-xl text-gray-800">Checkout Barang</h3><p className="text-sm text-gray-500">{product.nama_barang}</p></div>
                            <button onClick={() => setShowBuyModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xl font-bold transition">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmitOrder} className="p-6 space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Nama Penerima</label><input type="text" name="nama_penerima" value={orderForm.nama_penerima} onChange={handleFormChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">No. Telepon</label><input type="text" name="telepon_penerima" value={orderForm.telepon_penerima} onChange={handleFormChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Jumlah</label><input type="number" name="jumlah" min="1" max={product.stok_barang} value={orderForm.jumlah} onChange={handleFormChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                            </div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Alamat Pengiriman</label><textarea name="alamat_pengiriman" rows="3" value={orderForm.alamat_pengiriman} onChange={handleFormChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required></textarea></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Waktu Kirim</label><input type="datetime-local" name="waktu_pengiriman" value={orderForm.waktu_pengiriman} onChange={handleFormChange} className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Pembayaran</label><select name="metode_pembayaran" value={orderForm.metode_pembayaran} onChange={handleFormChange} className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"><option value="cod">COD</option><option value="qris">QRIS</option><option value="mbanking">Transfer Bank</option></select></div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center"><span className="font-bold text-gray-600">Total Tagihan:</span><span className="text-blue-700 font-extrabold text-2xl">{formatRupiah(product.harga_barang * orderForm.jumlah)}</span></div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">Konfirmasi Pesanan</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}