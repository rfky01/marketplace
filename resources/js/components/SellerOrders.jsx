import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatBox from './ChatBox';
import iconPesanan from './asset/pesan.png'
import iconPesananKosong from './asset/belumadapesanan.png'

export default function SellerOrders() {
    const [sellerOrders, setSellerOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});

    // --- STATE TAB MENU ---
    const [activeTab, setActiveTab] = useState('all');

    // --- STATE CHAT ---
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatTarget, setChatTarget] = useState({ id: null, name: '' });

    const openChat = (buyerId, buyerName) => {
        setChatTarget({ id: buyerId, name: buyerName });
        setIsChatOpen(true);
    };

    // --- FUNGSI BUKA MODAL KONFIRMASI (Ganti Alert Browser) ---
    const openStatusModal = (item, action) => {
        setActionToConfirm({ item, action });
        setIsConfirmModalOpen(true);
    };

    // --- STATE NAVBAR ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- STATE MODAL: TERIMA PESANAN ---
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveryTime, setDeliveryTime] = useState('');

    // --- STATE MODAL: TOLAK PESANAN ---
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [orderToReject, setOrderToReject] = useState(null);

    // --- STATE MODAL: HAPUS RIWAYAT (BARU) ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDeleteId, setOrderToDeleteId] = useState(null);

    // --- STATE MODAL: KONFIRMASI STATUS (BARU - UNTUK KIRIM/RETURN) ---
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState({ item: null, action: '' });

    // --- STATE ALERT / NOTIFIKASI ---
    const [customAlert, setCustomAlert] = useState({
        isOpen: false,
        message: '',
        type: 'success', 
        onConfirm: null
    });

    const navigate = useNavigate();

    // --- KONFIGURASI TAB ---
    const tabs = [
        { id: 'all', label: 'Semua', statuses: [] },
        { id: 'pending', label: 'Pesanan Baru', statuses: ['pending'] },
        { id: 'accepted', label: 'Siap Dikirim', statuses: ['accepted', 'proses'] },
        { id: 'dikirim', label: 'Sedang Dikirim', statuses: ['dikirim'] },
        { id: 'selesai', label: 'Selesai', statuses: ['selesai'] },
        { id: 'return', label: 'Komplain / Return', statuses: ['return_requested', 'return_accepted', 'return_rejected'] },
        { id: 'batal', label: 'Dibatalkan', statuses: ['canceled by seller', 'canceled by buyer', 'ditolak', 'canceled'] },
    ];

    // --- EFFECT: AUTO CLOSE NOTIFIKASI SUKSES ---
    useEffect(() => {
        let timer;
        if (customAlert.isOpen && customAlert.type === 'success') {
            timer = setTimeout(() => {
                setCustomAlert(prev => ({ ...prev, isOpen: false }));
            }, 3000); 
        }
        return () => clearTimeout(timer);
    }, [customAlert]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (userData) setUser(JSON.parse(userData));

        const fetchUserData = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/user', { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                const data = await response.json();
                
                if (response.ok) {
                    setUser(data); 
                    localStorage.setItem('user', JSON.stringify(data)); 
                }
            } catch (error) {
                console.error("Gagal refresh data user:", error);
            }
        };

        fetchUserData();
        fetchSellerOrders();
        
        const intervalId = setInterval(() => {
            fetchSellerOrders(true); // Kirim parameter true (isBackground)
        }, 5000);

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

    const fetchSellerOrders = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/seller/orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSellerOrders(data.data);
            }
        } catch (error) {
            console.error("Error fetching seller orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = sellerOrders.filter(item => {
        if (activeTab === 'all') return true;
        
        const rawStatus = item.pesanan?.status || 'pending';
        const currentStatus = rawStatus.toLowerCase().trim();
        const targetStatuses = tabs.find(t => t.id === activeTab)?.statuses || [];
        return targetStatuses.includes(currentStatus);
    });

    const formatDateTimeIndo = (dateString) => {
        if (!dateString) return '-';
        const options = { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const sendWhatsappFonnte = async (targetPhone, customerName, invoice, estimasiKirim, alamatPenerima, totalHarga, metodeBayar) => {
        const token = "PzkJf4FzoSnZy5ATt9gN"; 
        if (!targetPhone) return;

        const waktuCantik = formatDateTimeIndo(estimasiKirim);
        const hargaCantik = typeof totalHarga === 'number' ? formatRupiah(totalHarga) : totalHarga;

        const message = `Halo Kak ${customerName},\n\n` +
            `Pesanan Anda dengan invoice *${invoice}* telah kami *TERIMA* dan sedang dalam proses pengemasan.\n\n` +
            `💰 *Total Pesanan:* ${hargaCantik}\n` + 
            `💳 *Metode Pembayaran:* ${metodeBayar}\n` +
            `⏰ *Estimasi Tiba:*\n ${waktuCantik}\n\n` +
            `📍 *Alamat Tujuan:*\n${alamatPenerima}\n\n` + 
            `Terima kasih telah berbelanja di MarketplacePlus!`;

        const formData = new FormData();
        formData.append("target", targetPhone);
        formData.append("message", message);
        formData.append("countryCode", "62"); 

        try {
            await fetch("https://api.fonnte.com/send", {
                method: "POST", headers: { Authorization: token }, body: formData,
            });
        } catch (error) { console.error("Gagal kirim WA Fonnte:", error); }
    };

    // --- FUNGSI EKSEKUSI API (Dipanggil saat klik "Ya" di Modal) ---
    const executeStatusUpdate = async () => {
        // Ambil data dari state sementara
        const { item, action } = actionToConfirm;
        if (!item) return;

        const token = localStorage.getItem('token');
        const url = `http://127.0.0.1:8000/api/seller/orders/${item.id}`; 
        
        let statusToSend = action;
        // Khusus jika action 'dibatalkan', ubah stringnya (jika logika ini dipakai di modal lain)
        if (action === 'dibatalkan') statusToSend = 'canceled by seller';
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' 
                },
                body: JSON.stringify({ status: statusToSend })
            });
            const data = await response.json();

            if(response.ok) {
                let successMsg = "Status berhasil diperbarui.";
                if (action === 'dikirim') successMsg = "Status diperbarui: Sedang Dikirim.";
                if (action === 'return_accepted') successMsg = "Return DITERIMA.";
                if (action === 'return_rejected') successMsg = "Return DITOLAK.";

                setCustomAlert({ isOpen: true, message: successMsg, type: 'success', onConfirm: null });
                fetchSellerOrders();
            } else {
                setCustomAlert({ isOpen: true, message: "Gagal: " + (data.message || "Kesalahan"), type: 'error' });
            }
        } catch (error) { 
            console.error(error); 
            setCustomAlert({ isOpen: true, message: "Koneksi Error", type: 'error' }); 
        } finally {
            // TUTUP MODAL SETELAH SELESAI
            setIsConfirmModalOpen(false);
            setActionToConfirm({ item: null, action: '' });
        }
    };

    // --- LOGIKA MODAL TOLAK ---
    const openRejectModal = (item) => {
        setOrderToReject(item);
        setIsRejectModalOpen(true);
    };

    // --- PERBAIKAN LOGIKA TOLAK PESANAN ---
    const handleConfirmReject = async () => {
        if (!orderToReject) return;

        const token = localStorage.getItem('token');
        try {
            // Kita panggil API update yang sama, tapi statusnya 'canceled by seller'
            const response = await fetch(`http://127.0.0.1:8000/api/seller/orders/${orderToReject.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                // Kirim status 'canceled by seller' agar backend tahu ini pembatalan
                body: JSON.stringify({ status: 'canceled by seller' })
            });

            const data = await response.json();

            if(response.ok) {
                // Tutup modal & Beri notifikasi sukses
                setIsRejectModalOpen(false);
                setCustomAlert({ isOpen: true, message: "Pesanan berhasil ditolak & Stok dikembalikan.", type: 'success' });
                
                // Refresh data agar pesanan hilang dari list 'Pending'
                fetchSellerOrders(); 
                setOrderToReject(null);
            } else {
                alert("Gagal: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) { 
            console.error(error); 
            alert("Terjadi kesalahan koneksi"); 
        }
    };

    // --- LOGIKA MODAL TERIMA ---
    const openAcceptModal = (item) => {
        setSelectedOrder(item);
        setDeliveryTime('');
        setIsAcceptModalOpen(true);
    };

    const handleConfirmAccept = async () => {
        if (!deliveryTime) { alert("Harap tentukan estimasi waktu kirim!"); return; }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/seller/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ status: 'accepted', waktu_pengiriman: deliveryTime })
            });
            const data = await response.json();

            if(response.ok) {
                setIsAcceptModalOpen(false); 
                setCustomAlert({ isOpen: true, message: "Pesanan diterima! Segera siapkan paket.", type: 'success', onConfirm: null });

                const buyerProfile = selectedOrder.pesanan?.user;
                const phone = buyerProfile?.telepon || buyerProfile?.phone || buyerProfile?.no_hp || selectedOrder.pesanan?.telepon_penerima;
                const name = selectedOrder.pesanan?.nama_penerima || "Pembeli";
                const inv = selectedOrder.pesanan?.invoice_code || "-";
                const address = selectedOrder.pesanan?.alamat_pengiriman || "Alamat tidak tersedia";
                const total = selectedOrder.pesanan?.grand_total || (selectedOrder.jumlah * selectedOrder.harga_satuan);
                const paymentMethod = selectedOrder.pesanan?.metode_pembayaran || "-";

                sendWhatsappFonnte(phone, name, inv, deliveryTime, address, total, paymentMethod); 
                fetchSellerOrders();
            } else {
                alert("Gagal: " + (data.message || "Terjadi kesalahan"));
            }
        } catch (error) { console.error(error); alert("Terjadi kesalahan koneksi"); }
    };

    // --- LOGIKA MODAL HAPUS RIWAYAT (BARU) ---
    const openDeleteModal = (id) => {
        setOrderToDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!orderToDeleteId) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/seller/orders/${orderToDeleteId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' 
                }
            });

            if (response.ok) {
                setSellerOrders(prev => prev.filter(order => order.id !== orderToDeleteId));
                setCustomAlert({ isOpen: true, message: "Riwayat pesanan berhasil dihapus.", type: 'success' });
            } else {
                setCustomAlert({ isOpen: true, message: "Gagal menghapus data.", type: 'error' });
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            setCustomAlert({ isOpen: true, message: "Gagal koneksi ke server.", type: 'error' });
        } finally {
            setIsDeleteModalOpen(false);
            setOrderToDeleteId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getProfilePhoto = () => {
        if (user.profile_photo) {
            if (user.profile_photo.startsWith('http')) return user.profile_photo;
            return `http://127.0.0.1:8000/storage/${user.profile_photo}`;
        }
        return null;
    };

    const getBuyerPhoto = (buyerData) => {
        if (buyerData && buyerData.profile_photo) {
            if (buyerData.profile_photo.startsWith('http')) return buyerData.profile_photo;
            return `http://127.0.0.1:8000/storage/${buyerData.profile_photo}`;
        }
        return null;
    };

    const getProductImage = (product) => {
        if (!product) return "https://via.placeholder.com/150";
        if (Array.isArray(product.foto_barang) && product.foto_barang.length > 0) return `http://127.0.0.1:8000/storage/${product.foto_barang[0]}`;
        if (typeof product.foto_barang === 'string' && product.foto_barang) {
            return product.foto_barang.startsWith('http') ? product.foto_barang : `http://127.0.0.1:8000/storage/${product.foto_barang}`;
        }
        return "https://via.placeholder.com/150?text=No+Image";
    };

    const formatRupiah = (num) => {
        const n = Number(num);
        if (isNaN(n)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', minimumFractionDigits:0}).format(n);
    };

    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-blue-50 w-full font-sans pb-20">
            
            {/* --- NAVBAR --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-50 w-full mb-8">
                <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight decoration-none">
                            Marketplace<span className="text-gray-700">Plus</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/my-products" className="text-gray-500 hover:text-blue-600 font-medium px-4 py-2 transition decoration-none border-r border-gray-300 pr-4">
                            Produk Saya
                        </Link>
                        <Link to="/" className="text-gray-500 hover:text-blue-600 font-medium px-4 py-2 transition decoration-none">
                            Dashboard
                        </Link>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition border border-transparent hover:border-gray-200">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-200">
                                    {getProfilePhoto() ? (
                                        <img src={getProfilePhoto()} alt="Profile" className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">{user.name?.charAt(0).toUpperCase()}</div>
                                    )}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs text-gray-500">Halo,</p>
                                    <p className="text-sm font-bold text-gray-800 max-w-[100px] truncate">{user.name}</p>
                                </div>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-white">
                                            {getProfilePhoto() ? (
                                                <img src={getProfilePhoto()} alt="Profile" className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold bg-blue-50">{user.name?.charAt(0).toUpperCase()}</div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                            <p className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full inline-block">Penjual</p>
                                        </div>
                                    </div>
                                    <div className="py-2">
                                        <Link to="/my-products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2">Toko Saya</Link>
                                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 decoration-none flex items-center gap-2">Daftar Pesanan</Link>
                                    </div>
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition">Keluar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- CONTAINER UTAMA --- */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    
                    {/* --- BAGIAN KIRI: SIDEBAR MENU --- */}
                    <div className="w-full lg:w-64 flex-shrink-0 sticky top-24 z-30">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h1 className="text-2xl font-bold text-gray-800">Pesanan Masuk</h1>
                            <span className="lg:hidden bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">{sellerOrders.length}</span>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 hidden lg:flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 text-sm">Status Pesanan</h3>
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{sellerOrders.length}</span>
                            </div>
                            
                            <div className="hidden lg:flex flex-col p-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all mb-1 flex justify-between items-center ${
                                            activeTab === tab.id 
                                            ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100' 
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && <span className="text-blue-500">•</span>}
                                    </button>
                                ))}
                            </div>

                            <div className="lg:hidden flex overflow-x-auto no-scrollbar p-2 gap-2 border-b border-gray-100">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap border transition-all ${
                                            activeTab === tab.id 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- BAGIAN KANAN: DAFTAR PESANAN --- */}
                    <div className="flex-1 w-full min-w-0">
                        {filteredOrders.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center animate-fade-in">
                                <img src={iconPesananKosong} alt="belumadapesanan" className="w-25 h-20 object-contain opacity-60 group-hover:opacity-100 transition duration-200"/>
                                {activeTab === 'all' || sellerOrders.length === 0 ? (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-800 mb-2">Belum ada pesanan masuk</h2>
                                        <p className="text-gray-500 mb-6 text-sm">Pesanan dari pembeli akan muncul di sini.</p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-lg font-bold text-gray-700 mb-1">Tidak ada pesanan</h2>
                                        <p className="text-gray-500 text-sm">Tidak ada pesanan di status "{tabs.find(t => t.id === activeTab)?.label}"</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredOrders.map((item) => {
                                    const rawStatus = item.pesanan?.status || 'pending';
                                    const currentStatus = rawStatus.toLowerCase().trim();
                                    const isCancelled = currentStatus.includes('dibatalkan') || currentStatus.includes('cancel') || currentStatus.includes('seller');
                                    const buyerData = item.pesanan?.user;

                                    return (
                                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition animate-slide-in">
                                            
                                            <div className="bg-white px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                <div className="flex items-center gap-3">
                                                    <Link to={`/profile/${buyerData?.id}`} className="group relative">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0 group-hover:ring-2 ring-blue-400 transition">
                                                            {getBuyerPhoto(buyerData) ? (
                                                                <img src={getBuyerPhoto(buyerData)} alt="Pembeli" className="w-full h-full object-cover"/>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold bg-blue-50 text-xs">
                                                                    {item.pesanan?.nama_penerima?.charAt(0).toUpperCase() || '👤'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <Link to={`/profile/${buyerData?.id}`} className="text-sm font-bold text-gray-800 hover:text-blue-600 transition">
                                                                {item.pesanan?.nama_penerima || "Pembeli"}
                                                            </Link>
                                                            <span className="text-[10px] text-gray-400">• {formatDate(item.created_at)}</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-mono tracking-wide">{item.pesanan?.invoice_code}</span>
                                                    </div>
                                                </div>
                                                
                                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
                                                    ${currentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                                      currentStatus === 'accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                      currentStatus === 'dikirim' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                      currentStatus === 'selesai' ? 'bg-green-50 text-green-700 border-green-200' :
                                                      currentStatus.includes('return') ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                      'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {currentStatus === 'return_requested' ? 'Return' : currentStatus}
                                                </span>
                                            </div>

                                            <div className="p-4 grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_auto] gap-4 items-start">
                                                
                                                <div className="flex gap-3">
                                                    <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
                                                        <img src={getProductImage(item.produk)} alt={item.produk?.nama_barang} className="w-full h-full object-cover" onError={(e)=>{e.target.src="https://via.placeholder.com/150"}}/>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 mb-0.5">{item.produk?.nama_barang}</h3>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>{item.jumlah} barang</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span className="font-bold text-blue-600">{formatRupiah((item.jumlah * item.produk?.harga_barang))}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-gray-600 border-l border-gray-100 pl-4 hidden md:block">
                                                    <div className="mb-2">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Alamat</p>
                                                        <p className="leading-tight text-gray-800 line-clamp-2">{item.pesanan?.alamat_pengiriman || "-"}</p>
                                                    </div>

                                                    {item.pesanan?.waktu_pengiriman && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            {/* ICON JAM / WAKTU */}
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-medium text-gray-700">{formatDateTime(item.pesanan?.waktu_pengiriman)}</span>
                                                        </div>
                                                    )}

                                                    <div className="mt-1.5 flex items-center gap-1.5 text-gray-500">
                                                        {/* ICON TELEPON */}
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {item.pesanan?.telepon_penerima || "-"}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 w-full md:w-auto min-w-[140px] items-end justify-center h-full">
                                                    
                                                    {currentStatus === 'pending' && (
                                                        <div className="flex gap-2 w-full">
                                                            <button onClick={() => openRejectModal(item)} className="flex-1 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50 transition">Tolak</button>
                                                            <button onClick={() => openAcceptModal(item)} className="flex-1 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm transition">Terima</button>
                                                        </div>
                                                    )}
                                                    
                                                    {currentStatus === 'accepted' && (
                                                        <button onClick={() => openStatusModal(item, 'dikirim')} className="w-full py-1.5 text-xs font-bold text-white bg-yellow-500 rounded hover:bg-yellow-600 shadow-sm transition">Kirim Barang</button>
                                                    )}

                                                    {currentStatus === 'dikirim' && (
                                                        <div className="w-full py-1.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold text-center border border-gray-200 cursor-default">Menunggu Konfirmasi</div>
                                                    )}

                                                    {currentStatus === 'return_requested' && (
                                                        <div className="flex flex-col gap-1 w-full">
                                                            <div className="text-[10px] text-orange-600 font-bold text-center bg-orange-50 py-0.5 rounded">Ajukan Return</div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => openStatusModal(item, 'return_rejected')} className="flex-1 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded hover:bg-red-50">Tolak</button>
                                                                <button onClick={() => openStatusModal(item, 'return_accepted')} className="flex-1 py-1.5 text-xs font-bold text-white bg-green-600 rounded hover:bg-green-700 shadow-sm">Terima</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(currentStatus === 'selesai' || isCancelled || currentStatus === 'return_accepted' || currentStatus === 'return_rejected') && (
                                                        // --- TOMBOL HAPUS RIWAYAT DENGAN POPUP BARU ---
                                                        <button 
                                                            onClick={() => openDeleteModal(item.id)} 
                                                            className="w-full py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-300 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                                                        >
                                                            Hapus Riwayat
                                                        </button>
                                                        // ----------------------------------------------
                                                    )}
                                                    
                                                    <button 
                                                            onClick={() => openChat(buyerData?.id, item.pesanan?.nama_penerima)}
                                                            className="w-full py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <img src={iconPesanan} alt="Chat" className="w-3.5 h-3.5 object-contain"/>
                                                            <span>Chat Pembeli</span>
                                                    </button>

                                                </div>
                                            </div>
                                            
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL KONFIRMASI TOLAK --- */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform scale-100 transition-all">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
                            <span className="text-3xl font-bold">!</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Tolak Pesanan?</h3>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            Apakah Anda yakin ingin menolak pesanan ini? <br/>
                            <span className="font-bold text-red-500">Stok barang akan dikembalikan otomatis.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition">Batal</button>
                            <button onClick={handleConfirmReject} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition">Ya, Tolak</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL KONFIRMASI HAPUS RIWAYAT (BARU) --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform scale-100 transition-all">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
                            <span className="text-3xl font-bold">🗑️</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Riwayat?</h3>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            Hapus riwayat pesanan ini selamanya? <br/>
                            <span className="font-bold text-red-500">Tindakan ini tidak dapat dibatalkan.</span>
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition">Batal</button>
                            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg transition">Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL ATUR JADWAL --- */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in" style={{ display: isAcceptModalOpen ? 'flex' : 'none' }}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800">Atur Jadwal Pengiriman</h3>
                        <button onClick={() => setIsAcceptModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
                    </div>
                    <div className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Kapan barang akan dikirim?</label>
                            <input 
                                type="datetime-local" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={deliveryTime}
                                onChange={(e) => setDeliveryTime(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-2">Masukkan estimasi waktu Anda mengirim barang.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setIsAcceptModalOpen(false)} className="flex-1 py-2 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50">Batal</button>
                            <button onClick={handleConfirmAccept} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Konfirmasi</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TOAST NOTIFICATION --- */}
            {customAlert.isOpen && (
                <>
                    {customAlert.type === 'success' ? (
                        <div className="fixed top-24 right-4 z-[200] animate-slide-in">
                            <div className="bg-white shadow-xl rounded-lg border-l-4 border-green-500 p-4 flex items-center gap-3 min-w-[300px]">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><span className="font-bold text-lg">✓</span></div>
                                <div className="flex-1"><h4 className="font-bold text-gray-800 text-sm">Berhasil!</h4><p className="text-gray-600 text-xs">{customAlert.message}</p></div>
                                <button onClick={() => setCustomAlert({ ...customAlert, isOpen: false })} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
                            </div>
                        </div>
                    ) : (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform scale-100 transition-all">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600"><span className="text-3xl font-bold">!</span></div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Perhatian</h3>
                                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{customAlert.message}</p>
                                <button onClick={() => setCustomAlert({...customAlert, isOpen: false})} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg">OK</button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* --- MODAL KONFIRMASI STATUS (BARU) --- */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform scale-100 transition-all">
                        
                        {/* Ikon Tanya Biru */}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100 text-blue-600">
                            <span className="text-3xl font-bold">?</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi</h3>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            {actionToConfirm.action === 'dikirim' && "Apakah Anda yakin barang sudah dikirim?"}
                            {actionToConfirm.action === 'return_accepted' && "Terima pengajuan return ini? Dana akan dikembalikan ke pembeli."}
                            {actionToConfirm.action === 'return_rejected' && "Tolak pengajuan return ini?"}
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsConfirmModalOpen(false)} 
                                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 border border-gray-300 hover:bg-gray-100 transition"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={executeStatusUpdate} 
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition"
                            >
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ChatBox 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                receiverId={chatTarget.id} 
                receiverName={chatTarget.name} 
            />

        </div>
    );
}