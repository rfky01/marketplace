import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [user, setUser] = useState({});

    // STATE NAVBAR
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // STATE MODAL
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);

    // STATE POPUP NOTIFIKASI
    const [customAlert, setCustomAlert] = useState({
        isOpen: false,
        message: '',
        type: 'success', // 'success' atau 'error'
        onConfirm: null,
        showCancel: false, 
        confirmText: 'OK',
        cancelText: 'Batal'
    });

    const [checkoutForm, setCheckoutForm] = useState({
        telepon: '',
        alamat: '',
        metode_pembayaran: 'COD'
    });

    useEffect(() => {

        fetch(`http://127.0.0.1:8000/api/produk/${id}`)
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    setProduct(data.data);
                    // Set foto pertama sebagai main image default
                    if (Array.isArray(data.data.foto_barang) && data.data.foto_barang.length > 0) {
                        setMainImage(data.data.foto_barang[0]);
                    }
                }
            });
            
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (userData) setUser(JSON.parse(userData));

        fetchProduct();

        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
        
    }, [id]);

    const fetchProduct = async () => {
        try {
            // Pastikan Controller Laravel menggunakan: with(['ulasan.user'])
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${id}`);
            const data = await response.json();
            if (data.success) {
                setProduct(data.data);
                // Inisialisasi mainImage jika belum ada
                if (Array.isArray(data.data.foto_barang) && data.data.foto_barang.length > 0) {
                    setMainImage(data.data.foto_barang[0]);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCartModal = () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        setQty(1);
        setIsCartModalOpen(true);
    };

    const submitToCart = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/keranjang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ produk_id: product.id, jumlah: qty })
            });
            
            if (response.ok) {
                setCustomAlert({ 
                    isOpen: true, 
                    message: "Berhasil masuk keranjang! 🛒", 
                    type: 'success',
                    showCancel: false,
                    confirmText: 'OK'
                });
                setIsCartModalOpen(false);
            } else {
                setCustomAlert({ 
                    isOpen: true, 
                    message: "Gagal menambahkan ke keranjang", 
                    type: 'error',
                    showCancel: false,
                    confirmText: 'OK'
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBuyNow = () => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');
        setQty(1);
        setIsCheckoutModalOpen(true);
    };

    const handleConfirmOrder = async () => {
        if (!checkoutForm.telepon || !checkoutForm.alamat) {
            setCustomAlert({ 
                isOpen: true, 
                message: "Mohon lengkapi semua data pengiriman.", 
                type: 'error',
                showCancel: false,
                confirmText: 'OK'
            });
            return;
        }

        const token = localStorage.getItem('token');
        const now = new Date();
        const defaultTime = now.toISOString().slice(0, 19).replace('T', ' '); 

        const payload = {
            items: [{
                produk_id: product.id,
                jumlah: qty,
                total_harga: product.harga_barang * qty
            }],
            grand_total: product.harga_barang * qty,
            nama_penerima: user.name,
            email_penerima: user.email || "email@example.com", 
            telepon_penerima: checkoutForm.telepon,
            alamat_pengiriman: checkoutForm.alamat,
            metode_pembayaran: checkoutForm.metode_pembayaran,
            waktu_pengiriman: defaultTime 
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/orders', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                setIsCheckoutModalOpen(false);
                setCustomAlert({ 
                    isOpen: true, 
                    message: "Pesanan Berhasil! Ingin lihat riwayat pesanan sekarang?", 
                    type: 'success',
                    showCancel: true,
                    confirmText: 'Lihat Pesanan',
                    cancelText: 'Nanti Saja',
                    onConfirm: () => navigate('/orders')
                });
            } else {
                setCustomAlert({ 
                    isOpen: true, 
                    message: "Gagal: " + (data.message || "Terjadi kesalahan"), 
                    type: 'error',
                    showCancel: false,
                    confirmText: 'OK'
                });
            }
        } catch (error) {
            console.error("Detail Error:", error);
            setCustomAlert({ 
                isOpen: true, 
                message: "Terjadi kesalahan sistem (Cek Console).", 
                type: 'error',
                showCancel: false,
                confirmText: 'OK'
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(num);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!product) return <div className="text-center py-20 text-gray-500">Produk tidak ditemukan.</div>;

    // --- LOGIKA PERHITUNGAN RATING ---
    const ulasanList = product.ulasan || []; // Mengambil data ulasan dari relasi
    const totalUlasan = ulasanList.length;
    const rataRataRating = totalUlasan > 0 
        ? (ulasanList.reduce((acc, curr) => acc + parseInt(curr.rating), 0) / totalUlasan).toFixed(1) 
        : 0;

    // --- ARRAY GAMBAR ---
    const images = Array.isArray(product.foto_barang) ? product.foto_barang : [];

    return (
        <div className="min-h-screen bg-gray-50 w-full font-sans pb-20">
            
            {/* NAVBAR */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-blue-900 tracking-tight decoration-none">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/keranjang" className="text-2xl text-gray-500 hover:text-blue-900">🛒</Link>
                        <Link to="/" className="text-gray-500 hover:text-blue-900 font-medium decoration-none">Dashboard</Link>
                        <div className="relative" ref={dropdownRef}>
                            {user.name ? (
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">{user.name.charAt(0).toUpperCase()}</div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs text-gray-500">Halo,</p>
                                        <p className="text-sm font-bold text-gray-800 max-w-[100px] truncate">{user.name}</p>
                                    </div>
                                </button>
                            ) : (
                                <Link to="/login" className="text-blue-600 font-bold text-sm">Masuk</Link>
                            )}
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-50">
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-md text-sm font-bold">🚪 Keluar</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- KONTEN UTAMA PRODUK --- */}
            <div className="max-w-6xl mx-auto px-4">
                
                {/* KARTU DETAIL PRODUK */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
                    
                    {/* CONTAINER UTAMA */}
                    <div className="flex flex-col md:flex-row items-start relative">
                        
                        {/* 1. KOLOM KIRI (GALERI GAMBAR + TOMBOL BELI) */}
                        <div className="w-full md:w-5/12 lg:w-4/12 bg-gray-50 p-4 sticky top-28 self-start z-10 rounded-l-2xl flex flex-col items-center">
                            
                            {/* GAMBAR UTAMA (BESAR) */}
                            <div className="relative w-full max-w-xs aspect-square bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-4">
                                <img 
                                    src={`http://127.0.0.1:8000/storage/${mainImage}`} 
                                    alt={product.nama_barang} 
                                    className="w-full h-full object-cover transition duration-500"
                                    onError={(e)=>{e.target.src="https://via.placeholder.com/400"}}
                                />
                            </div>

                            {/* THUMBNAIL (LIST KECIL DI BAWAH) */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-4 w-full max-w-xs justify-center">
                                    {images.map((img, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => setMainImage(img)}
                                            className={`w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition flex-shrink-0 
                                                ${mainImage === img ? 'border-blue-600 opacity-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                                        >
                                            <img 
                                                src={`http://127.0.0.1:8000/storage/${img}`} 
                                                alt={`Thumb ${index}`} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TOMBOL AKSI */}
                            <div className="w-full max-w-xs flex gap-3 mt-2">
                                <button 
                                    onClick={handleOpenCartModal}
                                    className="flex-1 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition"
                                >
                                    + Keranjang
                                </button>
                                
                                <button 
                                    onClick={handleBuyNow}
                                    disabled={product.stok_barang <= 0}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Beli Sekarang
                                </button>
                            </div>

                        </div>

                        {/* 2. KOLOM KANAN (INFO PRODUK) */}
                        <div className="w-full md:w-7/12 lg:w-8/12 p-8 flex flex-col border-l border-gray-100">
                            
                            {/* Kategori & Stok */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
                                    {product.kategori}
                                </span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${product.stok_barang > 0 ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                                    {product.stok_barang > 0 ? `Stok: ${product.stok_barang} Unit` : 'Stok Habis'}
                                </span>
                            </div>

                            {/* Judul */}
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight break-words">
                                {product.nama_barang}
                            </h1>

                            {/* Harga */}
                            <div className="text-4xl font-bold text-blue-600 mb-6 lg:ml-14">
                                {formatRupiah(product.harga_barang)}
                            </div>

                            {/* Deskripsi */}
                            <div className="prose prose-sm max-w-none text-gray-600 mb-8 break-words leading-relaxed text-justify lg:ml-14">
                                <p className="whitespace-pre-line">
                                    {product.deskripsi || product.deskripsi_barang || "Tidak ada deskripsi untuk produk ini."}
                                </p>
                            </div>

                            {/* Penjual */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 lg:ml-14">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 text-lg">
                                    {product.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Penjual</p>
                                    <p className="text-sm font-bold text-gray-800">{product.user?.name || "Unknown Seller"}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* --- BAGIAN BARU: ULASAN PEMBELI (Sesuai Permintaan) --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    
                    {/* Header Ulasan */}
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-gray-800">Ulasan Pembeli</h2>
                        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                            <span className="text-yellow-500 font-bold text-lg">★</span>
                            <span className="font-bold text-gray-800">{rataRataRating}</span>
                            <span className="text-gray-400 text-sm">/ 5.0</span>
                            <span className="text-gray-300 text-sm mx-1">•</span>
                            <span className="text-gray-500 text-sm font-medium">{totalUlasan} Ulasan</span>
                        </div>
                    </div>

                    {/* Daftar Ulasan */}
                    <div className="space-y-8">
                        {ulasanList.length > 0 ? (
                            ulasanList.map((review, index) => (
                                <div key={index} className="flex gap-4">
                                    {/* Avatar User */}
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold flex-shrink-0 text-lg border border-gray-200">
                                        {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    
                                    {/* Isi Ulasan */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-gray-800 text-sm">{review.user?.name || "Pembeli"}</p>
                                            <span className="text-gray-300 text-xs">•</span>
                                            <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                                        </div>
                                        
                                        {/* Bintang */}
                                        <div className="flex text-yellow-400 text-sm mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                                            ))}
                                        </div>

                                        {/* comment */}
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {review.comment || review.comment || "Tidak ada comment."}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="text-4xl mb-3">💬</div>
                                <p className="text-gray-500 font-medium">Belum ada ulasan untuk produk ini.</p>
                                <p className="text-xs text-gray-400 mt-1">Jadilah yang pertama memberikan ulasan!</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* --------------------------------------------------- */}

            </div>

            {/* POPUP TAMBAH KERANJANG */}
            {isCartModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Tambah ke Keranjang</h3>
                            <button onClick={() => setIsCartModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition">✕</button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-4 mb-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                    <img src={`http://127.0.0.1:8000/storage/${mainImage}`} className="w-full h-full object-cover" onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 line-clamp-2 leading-snug">{product.nama_barang}</h4>
                                    <p className="text-blue-600 font-bold mt-1">{formatRupiah(product.harga_barang)}</p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Atur Jumlah (Stok: {product.stok_barang})</label>
                                <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-200 font-bold rounded-l-lg disabled:opacity-30" disabled={qty <= 1}>-</button>
                                    <input type="number" value={qty} readOnly className="w-full text-center bg-transparent text-gray-800 font-bold border-x border-gray-300 py-2 outline-none"/>
                                    <button onClick={() => setQty(Math.min(product.stok_barang, qty + 1))} className="px-4 py-2 text-blue-600 hover:bg-blue-100 font-bold rounded-r-lg disabled:opacity-30" disabled={qty >= product.stok_barang}>+</button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-700 mb-6 bg-gray-50 p-3 rounded-lg">
                                <span>Total Harga:</span>
                                <span className="text-blue-600 text-lg font-extrabold">{formatRupiah(product.harga_barang * qty)}</span>
                            </div>
                            <button onClick={submitToCart} disabled={product.stok_barang <= 0} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:bg-gray-300">Masukkan Keranjang</button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP CHECKOUT */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div><h3 className="text-lg font-bold text-gray-800">Checkout Barang</h3><p className="text-xs text-gray-500 break-all line-clamp-1">{product.nama_barang}</p></div>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No. Telepon</label>
                                    <input 
                                        type="tel" 
                                        inputMode="numeric"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                        placeholder="08xx..."
                                        value={checkoutForm.telepon} 
                                        onChange={(e) => setCheckoutForm({...checkoutForm, telepon: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jumlah (Stok: {product.stok_barang})</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-200 font-bold rounded-l-lg disabled:opacity-30" disabled={qty <= 1}>-</button>
                                        <input type="number" value={qty} readOnly className="w-full text-center bg-transparent text-gray-800 font-bold border-x border-gray-300 py-2 outline-none" />
                                        <button onClick={() => setQty(Math.min(product.stok_barang, qty + 1))} className="px-3 py-2 text-blue-600 hover:bg-blue-100 font-bold rounded-r-lg disabled:opacity-30" disabled={qty >= product.stok_barang}>+</button>
                                    </div>
                                </div>
                            </div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat Pengiriman</label><textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none" 
                            placeholder="Masukkan alamat lengkap..."
                            value={checkoutForm.alamat} 
                            onChange={(e) => setCheckoutForm({...checkoutForm, alamat: e.target.value})}></textarea></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pembayaran</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition" value={checkoutForm.metode_pembayaran} onChange={(e) => setCheckoutForm({...checkoutForm, metode_pembayaran: e.target.value})}>
                                    <option value="COD">COD</option>
                                    <option value="Transfer">Transfer Bank</option>
                                    <option value="E-Wallet">E-Wallet</option>
                                    </select></div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <div><p className="text-xs text-gray-500 font-bold mb-1">Total Tagihan:</p><p className="text-xl font-extrabold text-blue-600">{formatRupiah(product.harga_barang * qty)}</p></div>
                            <button onClick={handleConfirmOrder} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg">Konfirmasi Pesanan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- POPUP NOTIFIKASI KUSTOM (DENGAN 2 PILIHAN) --- */}
            {customAlert.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center transform scale-100 transition-all">
                        
                        {/* ICON */}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${customAlert.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <span className="text-3xl font-bold">{customAlert.type === 'success' ? '✓' : '!'}</span>
                        </div>

                        {/* TITLE & MESSAGE */}
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {customAlert.type === 'success' ? 'Berhasil!' : 'Perhatian!'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            {customAlert.message}
                        </p>

                        {/* BUTTONS */}
                        <div className="flex gap-3">
                            {/* Tombol Cancel (Optional) */}
                            {customAlert.showCancel && (
                                <button 
                                    onClick={() => setCustomAlert({...customAlert, isOpen: false})}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition shadow-sm"
                                >
                                    {customAlert.cancelText}
                                </button>
                            )}
                            
                            {/* Tombol Confirm */}
                            <button 
                                onClick={() => {
                                    setCustomAlert({...customAlert, isOpen: false});
                                    if(customAlert.onConfirm) customAlert.onConfirm();
                                }}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-white transition shadow-lg ${customAlert.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {customAlert.confirmText}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}