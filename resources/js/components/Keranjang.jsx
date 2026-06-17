import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SellerNavActions from './SellerNavActions';
import Pagination from './Pagination';
import iconHome from './asset/home.png';
import keranjangKosongImg from './asset/keranjangkosong.png';

const CART_ITEMS_PER_PAGE = 5;

export default function Keranjang() { 
    const [keranjangItems, setKeranjangItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    
    // STATE: Menyimpan ID barang yang diceklis
    const [selectedItems, setSelectedItems] = useState([]); 

    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- STATE UNTUK MODAL CHECKOUT ---
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState({
        telepon: '',
        alamat: '',
        // waktu_kirim dihapus dari state form karena otomatis
        metode_pembayaran: 'COD'
    });

    const [customAlert, setCustomAlert] = useState({
        isOpen: false,
        message: '',
        type: 'success', // 'success' atau 'error'
        onConfirm: null // Fungsi yang dijalankan saat tombol OK diklik
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }
        
        // 1. Load data awal dari local storage
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            
            // --- LOGIKA AUTOFILL DARI LOCAL STORAGE ---
            setCheckoutForm(prev => ({
                ...prev,
                telepon: parsedUser.telepon || parsedUser.telepon || parsedUser.no_hp || '',
                alamat:''
            }));
        }

        // 2. FETCH DATA USER TERBARU (Agar data profil selalu update)
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/user', {
                    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
                });
                const data = await response.json();
                
                if (response.ok) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    
                    // --- LOGIKA AUTOFILL DARI API TERBARU ---
                    setCheckoutForm(prev => ({
                        ...prev,
                        telepon: data.telepon || data.phone || data.no_hp || '',
                        alamat:''
                    }));
                }
            } catch (error) {
                console.error("Gagal refresh data user:", error);
            }
        };
        fetchUserData();

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

    // --- HELPER UNTUK MENGAMBIL FOTO (PERBAIKAN GAMBAR) ---
    const getProductImage = (produk) => {
        if (!produk) return "https://via.placeholder.com/150";
        
        // 1. Cek jika foto berupa Array (Format Baru - Banyak Foto)
        if (Array.isArray(produk.foto_barang) && produk.foto_barang.length > 0) {
            return `http://127.0.0.1:8000/storage/${produk.foto_barang[0]}`;
        }
        
        // 2. Cek jika foto berupa String (Format Lama - Satu Foto)
        if (typeof produk.foto_barang === 'string' && produk.foto_barang) {
            return produk.foto_barang.startsWith('http') 
                ? produk.foto_barang 
                : `http://127.0.0.1:8000/storage/${produk.foto_barang}`;
        }
        
        // 3. Default
        return "https://via.placeholder.com/150?text=No+Image";
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

    const getProfilePhoto = () => {
        if (user.profile_photo) {
            if (user.profile_photo.startsWith('http')) {
                return user.profile_photo;
            }
            return `http://127.0.0.1:8000/storage/${user.profile_photo}`;
        }
        return null;
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
    const lastPage = Math.max(1, Math.ceil(keranjangItems.length / CART_ITEMS_PER_PAGE));
    const paginatedCartItems = keranjangItems.slice((currentPage - 1) * CART_ITEMS_PER_PAGE, currentPage * CART_ITEMS_PER_PAGE);

    useEffect(() => {
        if (currentPage > lastPage) {
            setCurrentPage(lastPage);
        }
    }, [currentPage, lastPage]);

    // --- BUKA MODAL ---
    const handleOpenCheckoutModal = () => {
        if (selectedItems.length === 0) return alert("Pilih minimal satu barang untuk dibeli!");
        setIsCheckoutModalOpen(true);
    };

    // --- PROSES CHECKOUT ---
    const handleConfirmCheckout = async () => {
        if (!checkoutForm.telepon || !checkoutForm.alamat) {
            alert("Mohon lengkapi data pengiriman!");
            return;
        }

        const token = localStorage.getItem('token');
        
        // --- PERBAIKAN WAKTU (MENGGUNAKAN WAKTU LOKAL) ---
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        // --------------------------------------------------

        try {
            const checkoutPayload = {
                items: checkoutItems.map(item => ({
                    produk_id: item.produk_id,
                    jumlah: item.jumlah
                })),
                nama_penerima: user.name,
                email_penerima: user.email || "email@example.com",
                telepon_penerima: checkoutForm.telepon,
                alamat_pengiriman: checkoutForm.alamat,
                
                // Gunakan waktu lokal yang sudah diformat
                waktu_pengiriman: formattedTime, 
                
                metode_pembayaran: checkoutForm.metode_pembayaran
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
                // --- UPDATE: MUNCULKAN POPUP SUKSES ---
                setIsCheckoutModalOpen(false); 
                
                // Hapus item di background
                for (const itemId of selectedItems) {
                    await fetch(`http://127.0.0.1:8000/api/keranjang/${itemId}`, {
                        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
                    });
                }

                // Tampilkan Popup
                setCustomAlert({
                    isOpen: true,
                    message: "Checkout Berhasil! ✅",
                    type: 'success',
                    onConfirm: () => navigate('/orders') // Pindah halaman HANYA setelah klik OK
                });

            } else {
                setCustomAlert({
                    isOpen: true,
                    message: "Gagal Checkout: " + (data.message || "Terjadi kesalahan"),
                    type: 'error'
                });
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
        <div className="min-h-screen bg-blue-50 w-full font-sans pb-20">
            
            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto min-h-[4rem] flex flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3 py-2 sm:px-4 lg:px-8 md:h-16 md:flex-nowrap">
                    <div className="flex min-w-0 items-center gap-4 lg:gap-8">
                        <Link to="/" className="inline-flex items-center gap-2 md:gap-3 text-xl sm:text-2xl font-bold text-blue-600 tracking-tight decoration-none whitespace-nowrap">
                            <img src="/assets/burung.png" alt="Logo PangkalMart" className="h-9 w-9 md:h-12 md:w-12 shrink-0 object-contain" />
                            <span>Pangkal<span className="text-gray-700">Mart</span></span>
                        </Link>
                    </div>
                    <div className="order-3 flex w-full items-center justify-end gap-1 md:order-none md:w-auto md:gap-3 lg:gap-6">
                        <div className="hidden md:flex items-center gap-2">
                            <h1 className="text-lg font-bold text-gray-800 m-0">Keranjang Belanja</h1>
                        </div>
                        <SellerNavActions />

                        <Link
                            to="/orders"
                            className="text-gray-500 hover:text-blue-900 hover:bg-gray-100 transition p-2 rounded-full"
                            title="Daftar Pesanan"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 1.5h-3c.621 0 1.129.504 1.243 1.136.014.077.037.156.07.236h1.374c.033-.08.056-.159.07-.236.114-.632.622-1.136 1.243-1.136z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M3.75 15a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm0 4.5a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm0-9a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                            </svg>
                        </Link>
                        <Link
                            to="/"
                            className="text-gray-500 hover:text-blue-900 hover:bg-gray-100 transition p-2 rounded-full"
                            title="Dashboard">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                            </svg>
                        </Link>
                        <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition border border-transparent hover:border-gray-200">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-200">
                                        {getProfilePhoto() ? (
                                            <img 
                                                src={getProfilePhoto()} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-xs text-gray-500">Halo,</p>
                                        <p className="text-sm font-bold text-gray-800 max-w-[100px] truncate">{user.name}</p>
                                    </div>
                                </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-fade-in-down">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                                            {getProfilePhoto() ? (
                                                <img 
                                                    src={getProfilePhoto()} 
                                                    alt="Profile" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold bg-blue-50">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                            <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${user.products_count > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {user.products_count > 0 ? 'Penjual' : 'Pembeli'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {user.products_count > 0 && (
                                        <div className="py-2">
                                            <Link to="/seller-orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2">
                                                Daftar Pesanan
                                            </Link>
                                        </div>
                                    )}

                                    <div className="py-2">
                                        <Link to="/profile" className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2 transition-colors">
                                            {/* Icon Pensil SVG */}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                            Edit Profil
                                        </Link>
                                    </div>
                            
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                            </svg>
                                            Keluar
                                        </button>
                                    </div>
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
                            <img 
                                src={keranjangKosongImg} 
                                alt="Keranjang Kosong" 
                                className="w-40 h-40 object-contain opacity-50" 
                            />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang Anda Kosong</h2>
                        <Link to="/" className="inline-block bg-blue-600 text-white px-8 py-3 mt-4 rounded-full font-bold hover:bg-blue-700 transition shadow-lg no-underline">
                            Mulai Belanja Sekarang
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* LIST BARANG */}
                        <div className="flex-1 space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 border border-gray-100">
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems.length === keranjangItems.length && keranjangItems.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-gray-700 font-bold text-sm">Pilih Semua ({keranjangItems.length})</span>
                            </div>
                            {paginatedCartItems.map((item) => (
                                <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border transition ${selectedItems.includes(item.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}>
                                    <div className="flex-shrink-0">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => handleCheckboxChange(item.id)}
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100 group">
                                        <Link to={`/product/${item.produk?.id}`}>
                                            {/* --- UPDATE: MENGGUNAKAN HELPER getProductImage --- */}
                                            <img 
                                                src={getProductImage(item.produk)} 
                                                alt={item.produk?.nama_barang} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                                                onError={(e)=>{e.target.src="https://via.placeholder.com/150"}} 
                                            />
                                        </Link>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <Link to={`/product/${item.produk?.id}`} className="block hover:text-blue-600 transition">
                                            <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-2 leading-snug break-all" title={item.produk?.nama_barang}>
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
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <Pagination
                                currentPage={currentPage}
                                lastPage={lastPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>

                        {/* RINGKASAN BELANJA */}
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
                                    onClick={handleOpenCheckoutModal} 
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

            {/* ================================================== */}
            {/* === POPUP CHECKOUT (WAKTU KIRIM DIHAPUS) === */}
            {/* ================================================== */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Checkout Barang</h3>
                                <p className="text-xs text-gray-500">Membeli {totalItems} jenis barang</p>
                            </div>
                            <button onClick={() => setIsCheckoutModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition">
                                ✕
                            </button>
                        </div>

                        {/* Body Form */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            
                            {/* Baris 1: telepon & Total Item */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No. Telepon</label>
                                    <input 
                                        type="tel" 
                                        inputMode="numeric"
                                        readOnly
                                        className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 cursor-not-allowed outline-none"
                                        placeholder="08xx..."
                                        value={checkoutForm.telepon}
                                        onChange={(e) => setCheckoutForm({...checkoutForm, telepon: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Item</label>
                                    <div className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-gray-600 font-bold">
                                        {totalItems} Pcs
                                    </div>
                                </div>
                            </div>

                            {/* Baris 2: Alamat */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat Pengiriman</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none"
                                    placeholder="Masukkan Spesifik Tempat: Ruang A, Ruang B, ..."
                                    value={checkoutForm.alamat}
                                    onChange={(e) => setCheckoutForm({...checkoutForm, alamat: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Baris 3: Pembayaran (Waktu Kirim DIHAPUS, Pembayaran jadi Full Width) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pembayaran</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={checkoutForm.metode_pembayaran}
                                    onChange={(e) => setCheckoutForm({...checkoutForm, metode_pembayaran: e.target.value})}
                                >
                                    <option value="COD">COD </option>
                                    <option value="Transfer">Transfer Bank</option>
                                    <option value="E-Wallet">E-Wallet</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 font-bold mb-1">Total Tagihan:</p>
                                <p className="text-xl font-extrabold text-blue-600">{formatRupiah(grandTotal)}</p>
                            </div>
                            <button 
                                onClick={handleConfirmCheckout}
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform active:scale-95"
                            >
                                Konfirmasi Pesanan
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* --- CUSTOM POPUP ALERT --- */}
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

                        {/* BUTTON */}
                        <button 
                            onClick={() => {
                                setCustomAlert({...customAlert, isOpen: false});
                                if(customAlert.onConfirm) customAlert.onConfirm();
                            }}
                            className={`w-full py-2.5 rounded-xl font-bold text-white transition shadow-lg ${customAlert.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            OK
                        </button>

                    </div>
                </div>
            )}

        </div>
    );
}
