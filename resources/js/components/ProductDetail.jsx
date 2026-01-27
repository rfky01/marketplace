import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import iconPesan from './asset/pesan.png'
import iconKeranjang from './asset/keranjang.png'
import ChatBox from './ChatBox'; 

export default function ProductDetail() {
    const params = useParams();
    const slug = params.id || params.slug;
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

    // --- STATE CHAT ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState({ id: null, name: '' });

    const [isDescExpanded, setIsDescExpanded] = useState(false);

    // STATE POPUP NOTIFIKASI
    const [customAlert, setCustomAlert] = useState({
        isOpen: false,
        message: '',
        type: 'success', 
        onConfirm: null,
        showCancel: false, 
        confirmText: 'OK',
        cancelText: 'Batal'
    });

    const [checkoutForm, setCheckoutForm] = useState({
        phone: '',
        address: '',
        metode_pembayaran: 'COD'
    });

    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editForm, setEditForm] = useState({ rating: 0, comment: '' });

    // --- EFFECT: AUTO-CLOSE TOAST ---
    useEffect(() => {
        let timer;
        if (customAlert.isOpen && !customAlert.showCancel) {
            timer = setTimeout(() => {
                setCustomAlert(prev => ({ ...prev, isOpen: false }));
            }, 3000); 
        }
        return () => clearTimeout(timer);
    }, [customAlert]);

    useEffect(() => {
        if (!slug) return;
        fetch(`http://127.0.0.1:8000/api/produk/${slug}`)
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    setProduct(data.data);
                    if (Array.isArray(data.data.foto_barang) && data.data.foto_barang.length > 0) {
                        setMainImage(data.data.foto_barang[0]);
                    }
                } else {
                    console.error("Produk tidak ditemukan di API");
                }
            })
            .catch(err => console.error("Gagal fetch produk:", err))
            .finally(() => setLoading(false));
            
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setCheckoutForm(prev => ({
                ...prev,
                phone: parsedUser.phone || parsedUser.telepon || parsedUser.no_hp || '',
                address: parsedUser.address || parsedUser.alamat || ''
            }));
        }

        const fetchLatestUser = async () => {
            if(!token) return;
            try {
                const response = await fetch('http://127.0.0.1:8000/api/user', {
                    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
                });
                const data = await response.json();
                
                if (response.ok) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    setCheckoutForm(prev => ({
                        ...prev,
                        phone: data.phone || data.telepon || data.no_hp || '',
                        address: data.address || data.alamat || ''
                    }));
                }
            } catch (error) {
                console.error("Gagal refresh data user:", error);
            }
        };
        fetchLatestUser();
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
        
    }, [slug]);

    useEffect(() => {
        if (isCheckoutModalOpen) {
            const token = localStorage.getItem('token');
            if (token) {
                fetch('http://127.0.0.1:8000/api/user', {
                    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
                })
                .then(res => res.json())
                .then(data => {
                    const userData = data.data || data; // Handle wrapper
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));

                    // Update form dengan data terbaru dari server
                    setCheckoutForm(prev => ({
                        ...prev,
                        phone: userData.phone || userData.telepon || userData.no_hp || '',
                        address: userData.address || userData.alamat || ''
                    }));
                })
                .catch(err => console.error("Gagal refresh user:", err));
            }
        }
    }, [isCheckoutModalOpen]);

    const fetchProduct = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${slug}`);
            const data = await response.json();
            if (data.success) {
                setProduct(data.data);
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

    const handleEditClick = (review) => {
        setEditingReviewId(review.id);
        setEditForm({ rating: review.rating, comment: review.comment });
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditForm({ rating: 0, comment: '' });
    };

    const handleSaveEdit = async (reviewId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/ulasan/${reviewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            const data = await response.json();

            if (response.ok) {
                setCustomAlert({ isOpen: true, message: "Ulasan berhasil diedit!", type: 'success' });
                setEditingReviewId(null);
                fetchProduct(); // Refresh data produk untuk update ulasan di layar
            } else {
                setCustomAlert({ isOpen: true, message: data.message || "Gagal edit ulasan", type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setCustomAlert({ isOpen: true, message: "Terjadi kesalahan koneksi", type: 'error' });
        }
    };

    const openChat = (sellerId, sellerName) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCustomAlert({
                isOpen: true,
                message: "Silakan login terlebih dahulu.",
                type: 'error',
                showCancel: false,
                confirmText: 'OK'
            });
            return;
        }
        
        if (String(user.id) === String(sellerId)) {
            setCustomAlert({
                isOpen: true,
                message: "Ini produk Anda sendiri.",
                type: 'error',
                showCancel: false,
                confirmText: 'OK'
            });
            return;
        }

        setChatTarget({ id: sellerId, name: sellerName });
        setIsChatOpen(true);
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
                    showCancel: false, // Tidak butuh tombol cancel -> Jadi Toast
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
        console.log("Data User saat ini:", user); 
        console.log("Link KTM:", user.ktm_image);

        if (!checkoutForm.phone || !checkoutForm.address || !user.ktm_image) {
            
            // Pesan error spesifik agar user tahu apa yang kurang
            let missingParts = [];
            if (!checkoutForm.phone) missingParts.push("Nomor Telepon");
            if (!checkoutForm.address) missingParts.push("Alamat");
            if (!user.ktm_image) missingParts.push("Foto KTM");

            setCustomAlert({ 
                isOpen: true, 
                message: "Profil Anda belum lengkap. Harap isi address dan Nomor Telepon di menu Profil sebelum memesan.", 
                type: 'error', // Tipe Error
                showCancel: true, // TRUE agar muncul di tengah (Modal)
                confirmText: 'Lengkapi Profil',
                cancelText: 'Batal',
                onConfirm: () => navigate('/profile') // Arahkan ke profil
            });
            return;
        }

        const token = localStorage.getItem('token');
        // Waktu Lokal
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const payload = {
            items: [{
                produk_id: product.id,
                jumlah: qty,
                total_harga: product.harga_barang * qty
            }],
            grand_total: product.harga_barang * qty,
            nama_penerima: user.name,
            email_penerima: user.email || "email@example.com", 
            telepon_penerima: checkoutForm.phone,
            alamat_pengiriman: checkoutForm.address,
            metode_pembayaran: checkoutForm.metode_pembayaran,
            waktu_pengiriman: formattedTime 
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
                    showCancel: true, // Ada Cancel -> Jadi Modal Tengah
                    confirmText: 'Lihat Pesanan',
                    cancelText: 'Nanti Saja',
                    onConfirm: () => navigate('/orders')
                });
            } else {
                if (data.message && data.message.toLowerCase().includes('profil')) {
                    setCustomAlert({
                        isOpen: true,
                        message: data.message, // Pesan dari backend
                        type: 'error',
                        showCancel: true, // TRUE = MODAL TENGAH
                        confirmText: 'Lengkapi Profil',
                        cancelText: 'Batal',
                        onConfirm: () => navigate('/profile')
                    });
                } else {
                    // Error lain tetap Toast
                    setCustomAlert({ 
                        isOpen: true, 
                        message: "Gagal: " + (data.message || "Terjadi kesalahan"), 
                        type: 'error',
                        showCancel: false,
                        confirmText: 'OK'
                    });
                }
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

    const ulasanList = product.ulasan || []; 
    const totalUlasan = ulasanList.length;
    const rataRataRating = totalUlasan > 0 
        ? (ulasanList.reduce((acc, curr) => acc + parseInt(curr.rating), 0) / totalUlasan).toFixed(1) 
        : 0;

    const images = Array.isArray(product.foto_barang) ? product.foto_barang : [];
    const isOwner = String(user.id) === String(product.user?.id);

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
                        <Link to="/keranjang" 
                        className="text-2xl text-gray-500 hover:text-blue-900">
                            <img src={iconKeranjang} alt="keranjang" className="w-11 h-15 object-contain opacity-60 group-hover:opacity-100 transition duration-200"/>
                        </Link>
                        <Link to="/" className="text-gray-500 hover:text-blue-900 font-medium decoration-none">Dashboard</Link>
                        <div className="relative" ref={dropdownRef}>
                            {user.name ? (
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-200">
                                        {user.profile_photo ? (
                                            <img src={`http://127.0.0.1:8000/storage/${user.profile_photo}`} alt="Profile" className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">{user.name?.charAt(0).toUpperCase()}</div>
                                        )}
                                    </div>
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

            <div className="max-w-6xl mx-auto px-4">
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex flex-col md:flex-row items-start relative">
                        <div className="w-full md:w-5/12 lg:w-4/12 bg-gray-50 p-4 sticky top-28 self-start z-10 rounded-l-2xl flex flex-col items-center">
                            <div className="relative w-full max-w-xs aspect-square bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-4">
                                <img src={`http://127.0.0.1:8000/storage/${mainImage}`} alt={product.nama_barang} className="w-full h-full object-cover transition duration-500" onError={(e)=>{e.target.src="https://via.placeholder.com/400"}}/>
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-4 w-full max-w-xs justify-center">
                                    {images.map((img, index) => (
                                        <div key={index} onClick={() => setMainImage(img)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition flex-shrink-0 ${mainImage === img ? 'border-blue-600 opacity-100' : 'border-gray-200 opacity-60 hover:opacity-100'}`}>
                                            <img src={`http://127.0.0.1:8000/storage/${img}`} alt={`Thumb ${index}`} className="w-full h-full object-cover"/>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isOwner ? (
                                // JIKA PEMILIK: TAMPILKAN INFO
                                <div className="w-full max-w-xs mt-2 p-3 bg-gray-100 text-gray-500 text-center font-bold text-sm rounded-xl border border-gray-200 cursor-not-allowed">
                                    Produk Anda
                                </div>
                            ) : (
                                // JIKA BUKAN PEMILIK: TAMPILKAN TOMBOL BELI
                                <div className="w-full max-w-xs flex gap-3 mt-2">
                                    <button onClick={handleOpenCartModal} className="flex-1 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition">+ Keranjang</button>
                                    <button onClick={handleBuyNow} disabled={product.stok_barang <= 0} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed">Beli Sekarang</button>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-7/12 lg:w-8/12 p-8 flex flex-col border-l border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">{product.kategori}</span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${product.stok_barang > 0 ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>{product.stok_barang > 0 ? `Stok: ${product.stok_barang} Unit` : 'Stok Habis'}</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight break-words">{product.nama_barang}</h1>
                            <div className="text-4xl font-bold text-blue-600 mb-6 lg:ml-14">{formatRupiah(product.harga_barang)}</div>
                            <div className="mt-26 ml-10"> 
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Deskripsi Produk</h3>
                                <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                    {product.deskripsi ? (
                                        <>
                                            <span>{isDescExpanded ? product.deskripsi : product.deskripsi.substring(0, 150)}</span>
                                            {!isDescExpanded && product.deskripsi.length > 150 && "..."}
                                            {product.deskripsi.length > 150 && (
                                                <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="text-blue-600 font-bold ml-1 hover:underline focus:outline-none text-xs">{isDescExpanded ? "Lihat Lebih Sedikit" : "Lihat Selengkapnya"}</button>
                                            )}
                                        </>
                                    ) : (
                                        <span className="italic text-gray-400">Tidak ada deskripsi.</span>
                                    )}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <div className="flex flex-row items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <Link to={`/profile/${product.user?.id}`} className="flex flex-row items-center gap-4 hover:opacity-80 transition cursor-pointer decoration-none group">
                                        <div className="w-12 h-12 bg-white rounded-full overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm group-hover:ring-2 ring-blue-300 transition">
                                            {product.user?.profile_photo ? (
                                                <img src={`http://127.0.0.1:8000/storage/${product.user.profile_photo}`} alt={product.user?.name} className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">{product.user?.name?.charAt(0).toUpperCase() || "P"}</div>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Penjual</p>
                                            <p className="text-base font-bold text-gray-800">{product.user?.name || "Official Store"}</p>
                                        </div>
                                    </Link>
                                    {String(user.id) !== String(product.user?.id) && (
                                        <button type="button" onClick={() => openChat(product.user?.id, product.user?.name)} className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-sm font-bold text-sm ml-auto cursor-pointer">
                                            {!isOwner && (
                                                <button onClick={() => openChat(product.user?.id, product.user?.name)} className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm font-bold">Chat Penjual</button>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
                    <div className="space-y-8">
                        {ulasanList.length > 0 ? (
                            ulasanList.map((review, index) => {
                                const isMyReview = String(review.user_id) === String(user.id);
                                const isEditing = editingReviewId === review.id;

                                return (
                                    <div key={index} className="flex gap-4">
                                        {/* AVATAR */}
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold flex-shrink-0 text-lg border border-gray-200">
                                            {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>

                                        <div className="flex-1">
                                            {/* HEADER: NAMA & TANGGAL */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-800 text-sm">{review.user?.name || "Pembeli"}</p>
                                                    <span className="text-gray-300 text-xs">•</span>
                                                    <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                                                </div>

                                                {/* TOMBOL EDIT (Hanya muncul jika milik user & tidak sedang edit) */}
                                                {isMyReview && !isEditing && (
                                                    <button 
                                                        onClick={() => handleEditClick(review)}
                                                        className="text-xs font-bold text-blue-600 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </div>

                                            {/* LOGIKA TAMPILAN: FORM EDIT vs TEXT BIASA */}
                                            {isEditing ? (
                                                // --- TAMPILAN FORM EDIT ---
                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2 animate-fade-in">
                                                    {/* Edit Rating */}
                                                    <div className="flex gap-1 mb-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button 
                                                                key={star} 
                                                                type="button" 
                                                                onClick={() => setEditForm({ ...editForm, rating: star })}
                                                                className={`text-xl focus:outline-none transition ${star <= editForm.rating ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                                                            >
                                                                ★
                                                            </button>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Edit Komentar */}
                                                    <textarea 
                                                        className="w-full p-2 border border-gray-300 rounded text-sm mb-2 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                        rows="3"
                                                        value={editForm.comment}
                                                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                                                    />
                                                    
                                                    {/* Tombol Aksi */}
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            onClick={handleCancelEdit} 
                                                            className="px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSaveEdit(review.id)} 
                                                            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
                                                        >
                                                            Simpan
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // --- TAMPILAN NORMAL ---
                                                <>
                                                    <div className="flex text-yellow-400 text-sm mb-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                                                        ))}
                                                    </div>
                                                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment || "Tidak ada komentar."}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <img src={iconPesan} alt="pesan" className="w-20 h-20 object-contain opacity-60 group-hover:opacity-100 transition duration-200"/>
                                <p className="text-gray-500 font-medium">Belum ada ulasan untuk produk ini.</p>
                                <p className="text-xs text-gray-400 mt-1">Jadilah yang pertama memberikan ulasan!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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

            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Checkout Barang</h3>
                                <p className="text-xs text-gray-500">Membeli {qty} Pcs</p>
                            </div>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No. Telepon</label>
                                    <input type="tel" inputMode="numeric" readOnly className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 cursor-not-allowed outline-none" placeholder="Nomor diambil dari profil..." value={checkoutForm.phone} onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jumlah</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
                                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-200 font-bold rounded-l-lg disabled:opacity-30" disabled={qty <= 1}>-</button>
                                        <input type="number" value={qty} readOnly className="w-full text-center bg-transparent text-gray-800 font-bold border-x border-gray-300 py-2 outline-none" />
                                        <button onClick={() => setQty(Math.min(product.stok_barang, qty + 1))} className="px-3 py-2 text-blue-600 hover:bg-blue-100 font-bold rounded-r-lg disabled:opacity-30" disabled={qty >= product.stok_barang}>+</button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat Pengiriman</label>
                                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none" placeholder="Spesifik tempat: Ruang A, Ruang B, ...." value={checkoutForm.address} onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pembayaran</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition" value={checkoutForm.metode_pembayaran} onChange={(e) => setCheckoutForm({...checkoutForm, metode_pembayaran: e.target.value})}>
                                    <option value="COD">COD</option>
                                    <option value="Transfer">Transfer Bank</option>
                                    <option value="E-Wallet">E-Wallet</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 font-bold mb-1">Total Tagihan:</p>
                                <p className="text-xl font-extrabold text-blue-600">{formatRupiah(product.harga_barang * qty)}</p>
                            </div>
                            <button onClick={handleConfirmOrder} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg">Konfirmasi Pesanan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HYBRID NOTIFICATION (TOAST / MODAL) --- */}
            {customAlert.isOpen && (
                <>
                    {/* 1. TAMPILKAN TOAST (JIKA INFO / SUKSES) */}
                    {!customAlert.showCancel ? (
                        <div className="fixed top-24 right-4 z-[200] animate-slide-in">
                            <div className={`shadow-xl rounded-lg border-l-4 p-4 flex items-center gap-3 min-w-[300px] bg-white
                                ${customAlert.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                                
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                    ${customAlert.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    <span className="font-bold text-lg">
                                        {customAlert.type === 'error' ? '!' : '✓'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-sm">
                                        {customAlert.type === 'error' ? 'Gagal!' : 'Berhasil!'}
                                    </h4>
                                    <p className="text-gray-600 text-xs">{customAlert.message}</p>
                                </div>
                                <button 
                                    onClick={() => setCustomAlert({ ...customAlert, isOpen: false })} 
                                    className="text-gray-400 hover:text-gray-600 font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 2. TAMPILKAN MODAL TENGAH (JIKA BUTUH KONFIRMASI / ERROR) */
                        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center transform scale-100 transition-all">
                                
                                {/* --- MODIFIKASI: WARNA ICON DINAMIS (Merah jika Error) --- */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 
                                    ${customAlert.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    <span className="text-3xl font-bold">
                                        {customAlert.type === 'error' ? '!' : '✓'}
                                    </span>
                                </div>

                                {/* --- MODIFIKASI: JUDUL DINAMIS --- */}
                                <h3 className="text-lg font-bold text-gray-800 mb-2">
                                    {customAlert.type === 'error' ? 'Perhatian!' : 'Berhasil!'}
                                </h3>

                                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                    {customAlert.message}
                                </p>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setCustomAlert({...customAlert, isOpen: false})}
                                        className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition shadow-sm"
                                    >
                                        {customAlert.cancelText}
                                    </button>
                                    
                                    {/* --- MODIFIKASI: WARNA TOMBOL DINAMIS (Orange jika Error) --- */}
                                    <button 
                                        onClick={() => {
                                            setCustomAlert({...customAlert, isOpen: false});
                                            if(customAlert.onConfirm) customAlert.onConfirm();
                                        }}
                                        className={`flex-1 py-2.5 rounded-xl font-bold text-white transition shadow-lg 
                                            ${customAlert.type === 'error' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {customAlert.confirmText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="relative z-[9999]"> 
                <ChatBox 
                    isOpen={isChatOpen} 
                    onClose={() => setIsChatOpen(false)} 
                    receiverId={chatTarget.id} 
                    receiverName={chatTarget.name} 
                />
            </div>

        </div>
    );
}