import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    // State untuk menampung ID barang yang dipilih (Dicentang)
    const [selectedItems, setSelectedItems] = useState([]); 
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    // 1. AMBIL DATA KERANJANG
    const fetchCart = async () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/keranjang', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCartItems(data.data);
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. FUNGSI UPDATE JUMLAH
    const updateQuantity = async (id, currentQty, change) => {
        const targetItem = cartItems.find(item => item.id === id);
        if(!targetItem) return;

        const maxStock = targetItem.produk.stok_barang;
        const newQty = currentQty + change;

        if (newQty < 1) return;
        if (newQty > maxStock) {
            alert(`Maaf, stok hanya tersedia ${maxStock} unit.`);
            return;
        }

        const originalItems = [...cartItems]; 
        setCartItems(prevItems => 
            prevItems.map(item => 
                item.id === id ? { ...item, jumlah: newQty } : item
            )
        );

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/keranjang/${id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ jumlah: newQty })
            });

            const data = await response.json();
            if (!response.ok) {
                alert(data.message || "Gagal mengupdate stok");
                setCartItems(originalItems);
            }
        } catch (error) {
            setCartItems(originalItems); 
            console.error(error);
        }
    };

    // 3. FUNGSI HAPUS ITEM
    const removeItem = async (id) => {
        if (!confirm("Yakin ingin menghapus barang ini?")) return;
        const token = localStorage.getItem('token');
        setCartItems(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));

        try {
            await fetch(`http://127.0.0.1:8000/api/keranjang/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) { 
            console.error(error);
            fetchCart(); 
        }
    };

    // --- LOGIKA CHECKBOX ---
    const handleCheckboxChange = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(itemId => itemId !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === cartItems.length) {
            setSelectedItems([]); 
        } else {
            setSelectedItems(cartItems.map(item => item.id)); 
        }
    };

    // --- KALKULASI TOTAL ---
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
    const grandTotal = selectedCartItems.reduce((total, item) => total + (item.produk.harga_barang * item.jumlah), 0);
    const totalItems = selectedCartItems.reduce((total, item) => total + item.jumlah, 0);

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            alert("Silakan pilih minimal satu barang untuk di-checkout.");
            return;
        }
        alert(`Siap checkout ${selectedItems.length} barang dengan total ${formatRupiah(grandTotal)}`);
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(num);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4 transition">
                        <span className="mr-2">⬅️</span> Kembali Belanja
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        🛒 Keranjang Belanja
                    </h1>
                </div>

                {cartItems.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-gray-100">
                        <div className="text-6xl mb-4">🛍️</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Keranjang Anda Kosong</h2>
                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 mt-6 rounded-full font-bold hover:bg-blue-700 transition shadow-lg">
                            Mulai Belanja Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* Kiri: Daftar Barang */}
                        <div className="flex-1 space-y-4">
                            {/* Header Pilih Semua */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems.length === cartItems.length && cartItems.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="font-bold text-gray-700">Pilih Semua ({cartItems.length})</span>
                            </div>

                            {/* List Item */}
                            {cartItems.map((item) => (
                                <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border transition flex flex-col sm:flex-row items-center gap-4 ${selectedItems.includes(item.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}>
                                    
                                    {/* CHECKBOX */}
                                    <div className="flex items-center justify-center sm:justify-start">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => handleCheckboxChange(item.id)}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>

                                    {/* Gambar */}
                                    <div className="w-full sm:w-24 h-24 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                        <img src={item.produk.foto_barang} alt={item.produk.nama_barang} className="w-full h-full object-cover" onError={(e)=>{e.target.src="https://via.placeholder.com/150"}} />
                                    </div>

                                    {/* Info Produk */}
                                    {/* --- PERBAIKAN DI SINI: Menambahkan batas teks --- */}
                                    <div className="flex-1 text-center sm:text-left w-full min-w-0"> {/* min-w-0 penting untuk flex child */}
                                        <h3 
                                            className="font-bold text-lg text-gray-800 mb-1 line-clamp-2 break-all overflow-hidden" 
                                            title={item.produk.nama_barang}
                                        >
                                            {item.produk.nama_barang}
                                        </h3>
                                        <div className="text-blue-600 font-bold text-lg">
                                            {formatRupiah(item.produk.harga_barang)}
                                        </div>
                                        <div className={`text-xs mt-1 font-medium ${item.jumlah >= item.produk.stok_barang ? 'text-red-500' : 'text-gray-400'}`}>
                                            Sisa Stok: {item.produk.stok_barang}
                                        </div>
                                    </div>
                                    {/* ------------------------------------------------ */}

                                    {/* Kontrol Jumlah */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1 flex-shrink-0">
                                        <button onClick={() => updateQuantity(item.id, item.jumlah, -1)} disabled={item.jumlah <= 1} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-50">-</button>
                                        <span className="w-10 text-center font-bold text-gray-800">{item.jumlah}</span>
                                        <button onClick={() => updateQuantity(item.id, item.jumlah, 1)} disabled={item.jumlah >= item.produk.stok_barang} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-blue-600 font-bold hover:bg-blue-50 disabled:opacity-50">+</button>
                                    </div>

                                    {/* Tombol Hapus */}
                                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold text-sm px-2 flex-shrink-0">Hapus</button>
                                </div>
                            ))}
                        </div>

                        {/* Kanan: Ringkasan Belanja */}
                        <div className="w-full lg:w-96 h-fit bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <h3 className="font-bold text-xl text-gray-800 mb-6">Ringkasan Belanja</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600"><span>Total Barang (Dipilih)</span><span className="font-medium">{totalItems} Item</span></div>
                                <div className="flex justify-between text-gray-600"><span>Biaya Admin</span><span className="font-medium text-green-600">Gratis</span></div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 mb-6"><div className="flex justify-between items-end"><span className="font-bold text-gray-800">Total Harga</span><span className="font-extrabold text-2xl text-blue-600">{formatRupiah(grandTotal)}</span></div></div>
                            <button onClick={handleCheckout} disabled={selectedItems.length === 0} className={`w-full font-bold py-4 rounded-xl transition shadow-lg transform active:scale-[0.98] ${selectedItems.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}>{selectedItems.length > 0 ? `Checkout (${selectedItems.length})` : 'Pilih Barang Dulu'}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}