import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Keranjang() { 
    const [keranjangItems, setKeranjangItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});
    
    // STATE: Menyimpan ID barang yang diceklis
    const [selectedItems, setSelectedItems] = useState([]); 

    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }
        
        if (userData) setUser(JSON.parse(userData));

        fetchKeranjang();

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

    const fetchKeranjang = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/keranjang', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const validItems = data.data.filter(item => item.produk !== null);
                setKeranjangItems(validItems);
            }
        } catch (error) {
            console.error("Error fetching keranjang:", error);
        } finally {
            setLoading(false);
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
        if (selectedItems.length === keranjangItems.length) {
            setSelectedItems([]); 
        } else {
            setSelectedItems(keranjangItems.map(item => item.id)); 
        }
    };

    // --- LOGIKA UPDATE & HAPUS ---
    const updateQuantity = async (id, currentQty, change) => {
        const targetItem = keranjangItems.find(item => item.id === id);
        if(!targetItem || !targetItem.produk) return;

        const maxStock = targetItem.produk.stok_barang;
        const newQty = currentQty + change;

        if (newQty < 1) return;
        if (newQty > maxStock) {
            alert(`Maaf, stok hanya tersedia ${maxStock} unit.`);
            return;
        }

        const originalItems = [...keranjangItems]; 
        setKeranjangItems(prevItems => 
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
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ jumlah: newQty })
            });

            if (!response.ok) setKeranjangItems(originalItems);
        } catch (error) {
            setKeranjangItems(originalItems); 
        }
    };

    const removeItem = async (id) => {
        if (!confirm("Yakin ingin menghapus barang ini?")) return;
        
        setKeranjangItems(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));

        const token = localStorage.getItem('token');
        try {
            await fetch(`http://127.0.0.1:8000/api/keranjang/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) { 
            fetchKeranjang(); 
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- HITUNG TOTAL ---
    const checkoutItems = keranjangItems.filter(item => selectedItems.includes(item.id));
    const grandTotal = checkoutItems.reduce((total, item) => total + ((item.produk?.harga_barang || 0) * item.jumlah), 0);
    const totalItems = checkoutItems.reduce((total, item) => total + item.jumlah, 0);

    // --- CHECKOUT ---
    const handleCheckout = async () => {
        if (selectedItems.length === 0) return alert("Pilih minimal satu barang untuk dibeli!");

        const token = localStorage.getItem('token');
        try {
            const checkoutPayload = {
                items: checkoutItems.map(item => ({
                    produk_id: item.produk_id,
                    jumlah: item.jumlah
                })),
                nama_penerima: user.name,
                email_penerima: user.email || "email@example.com",
                telepon_penerima: "08123456789",
                alamat_pengiriman: "Alamat Utama User",
                waktu_pengiriman: new Date().toISOString().split('T')[0],
                metode_pembayaran: "Transfer Bank"
            };

            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(checkoutPayload)
            });
            
            const data = await response.json();

            if (response.ok) {
                alert("Checkout Berhasil! ✅");
                for (const itemId of selectedItems) {
                    await fetch(`http://127.0.0.1:8000/api/keranjang/${itemId}`, {
                        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
                    });
                }
                navigate('/orders');
            } else {
                alert("Gagal Checkout: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan sistem saat checkout.");
        }
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

                    {/* Area Kanan Navbar */}
                    <div className="flex items-center gap-6">
                        
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-xl text-gray-400">🛒</span>
                            <h1 className="text-lg font-bold text-gray-800 m-0">Keranjang Belanja</h1>
                        </div>

                        <Link to="/" className="hidden md:inline-flex items-center text-gray-500 hover:text-blue-600 font-medium transition no-underline text-sm border-l border-gray-300 pl-6">
                            <span className="mr-1 text-lg">⬅</span> Kembali Belanja
                        </Link>

                        {/* Profil User */}
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

            <div className="max-w-6xl mx-auto px-4">
                
                <div className="mb-4"></div>

                {keranjangItems.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                        <div className="flex justify-center mb-4">
                            <span className="text-6xl">🛍️</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang Anda Kosong</h2>
                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 mt-4 rounded-full font-bold hover:bg-blue-700 transition shadow-lg no-underline">
                            Mulai Belanja Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        
                        {/* --- LIST BARANG (KIRI) --- */}
                        <div className="flex-1 space-y-4">
                            
                            {/* Header Pilih Semua */}
                            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100">
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems.length === keranjangItems.length && keranjangItems.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-gray-700 font-bold text-sm">Pilih Semua ({keranjangItems.length})</span>
                            </div>

                            {/* Loop Items */}
                            {keranjangItems.map((item) => (
                                <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border transition ${selectedItems.includes(item.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}>
                                    
                                    {/* Checkbox Per Item */}
                                    <div className="flex-shrink-0">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => handleCheckboxChange(item.id)}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>

                                    {/* --- PERBAIKAN: GAMBAR BISA DIKLIK --- */}
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100 group">
                                        <Link to={`/product/${item.produk?.id}`}>
                                            <img 
                                                src={item.produk?.foto_barang} 
                                                alt={item.produk?.nama_barang} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                                                onError={(e)=>{e.target.src="https://via.placeholder.com/150"}} 
                                            />
                                        </Link>
                                    </div>

                                    {/* --- PERBAIKAN: JUDUL BISA DIKLIK --- */}
                                    <div className="flex-1 min-w-0 pr-2">
                                        <Link to={`/product/${item.produk?.id}`} className="block hover:text-blue-600 transition">
                                            <h3 
                                                className="font-bold text-lg text-gray-800 mb-1 line-clamp-2 leading-snug break-all"
                                                title={item.produk?.nama_barang}
                                            >
                                                {item.produk?.nama_barang || "Produk Tidak Tersedia"}
                                            </h3>
                                        </Link>
                                        
                                        <div className="text-blue-600 font-bold text-lg mb-1">
                                            {formatRupiah(item.produk?.harga_barang || 0)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Sisa Stok: {item.produk?.stok_barang || 0}
                                        </div>
                                    </div>

                                    {/* Kontrol Kanan */}
                                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                        <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.jumlah, -1)} 
                                                disabled={item.jumlah <= 1} 
                                                className="px-3 py-1 text-gray-500 hover:bg-gray-100 font-bold disabled:opacity-30"
                                            > - </button>
                                            <span className="w-8 text-center font-bold text-gray-800 text-sm">{item.jumlah}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.jumlah, 1)} 
                                                disabled={item.jumlah >= (item.produk?.stok_barang || 0)} 
                                                className="px-3 py-1 text-blue-600 hover:bg-blue-50 font-bold disabled:opacity-30"
                                            > + </button>
                                        </div>

                                        <button 
                                            onClick={() => removeItem(item.id)} 
                                            className="text-red-500 hover:text-red-700 font-bold text-xs"
                                        >
                                            Hapus
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>

                        {/* --- RINGKASAN BELANJA (KANAN) --- */}
                        <div className="w-full lg:w-96">
                            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
                                <h3 className="font-bold text-xl text-gray-800 mb-6">Ringkasan Belanja</h3>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-gray-600 text-sm">
                                        <span>Total Barang (Dipilih)</span>
                                        <span className="font-bold">{totalItems} Item</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 text-sm">
                                        <span>Biaya Admin</span>
                                        <span className="font-bold text-green-600">Gratis</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mb-6">
                                    <div className="flex justify-between items-end">
                                        <span className="font-bold text-gray-800">Total Harga</span>
                                        <span className="font-extrabold text-2xl text-blue-600">{formatRupiah(grandTotal)}</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleCheckout} 
                                    disabled={selectedItems.length === 0}
                                    className={`w-full font-bold py-4 rounded-xl transition shadow-lg transform active:scale-95 ${
                                        selectedItems.length > 0 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    {selectedItems.length > 0 ? `Checkout (${selectedItems.length})` : 'Pilih Barang Dulu'}
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}