import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// --- ICONS ---
const Icons = {
    Camera: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
    ),
    Edit: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
    ),
    Save: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
    ),
    Back: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    ),
    User: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
    ),
    Mail: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
    ),
    Card: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
    ),
    Upload: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
    )
};

export default function Profile() {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [user, setUser] = useState({
        name: '', email: '', phone: '', address: '', role: '',
        profile_photo: null, ktp_image: null,
        nomor_kk: '', dusun_rt_rw: '', nik: '',
        bio: '', jenis_kelamin: '', tanggal_lahir: '',
        created_at: '', updated_at: '', updater: null
    });
    
    // Foto Profil
    const [photoPreview, setPhotoPreview] = useState(null); 
    const [photoFile, setPhotoFile] = useState(null); 
    
    // Foto KTM (BARU)
    const [ktmPreview, setKtmPreview] = useState(null);
    const [ktmFile, setKtmFile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const fileInputRef = useRef(null);
    const ktmInputRef = useRef(null); // Ref untuk input KTM

    useEffect(() => { fetchProfile(); }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        try {
            const response = await fetch('http://127.0.0.1:8000/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setUser(data.data);
                localStorage.setItem('user', JSON.stringify(data.data));
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    // Handle Ganti Foto Profil
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file)); 
        }
    };

    // Handle Ganti KTM (BARU)
    const handleKtmChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setKtmFile(file);
            setKtmPreview(URL.createObjectURL(file));
        }
    };

    const triggerFileSelect = () => { if (isEditing && fileInputRef.current) fileInputRef.current.click(); };
    const triggerKtmSelect = () => { if (isEditing && ktmInputRef.current) ktmInputRef.current.click(); };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        ['name', 'phone', 'address', 'nomor_kk', 'dusun_rt_rw', 'nik', 'bio', 'jenis_kelamin', 'tanggal_lahir'].forEach(key => formData.append(key, user[key] || ''));
        formData.append('_method', 'PUT'); 
        
        if (photoFile) formData.append('profile_photo', photoFile);
        if (ktmFile) formData.append('ktp_image', ktmFile);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/profile', {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                setToast({ show: true, message: "Profil berhasil diperbarui.", type: 'success' });
                setIsEditing(false);
                setPhotoFile(null); 
                setKtmFile(null);
                fetchProfile(); 
            } else {
                setToast({ show: true, message: "Gagal: " + (data.message || "Terjadi kesalahan"), type: 'error' });
            }
        } catch (error) { 
            console.error(error); 
            setToast({ show: true, message: "Kesalahan koneksi", type: 'error' });
        } 
        finally { setIsSaving(false); }
    };

    const getPhotoUrl = () => {
        if (photoPreview) return photoPreview; 
        if (user.profile_photo) return `http://127.0.0.1:8000/storage/${user.profile_photo}`; 
        return null; 
    };

    // Helper untuk URL KTM
    const getKtmUrl = () => {
        if (ktmPreview) return ktmPreview;
        if (user.ktp_image) return `http://127.0.0.1:8000/storage/${user.ktp_image}`;
        return null;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20 relative">
            
            {/* --- TOP HEADER --- */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/" 
                            className="text-gray-500 hover:text-blue-900 transition p-1" 
                            title="Dashboard">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                            </svg>
                        </Link>
                        <h1 className="text-lg font-bold text-slate-800">Pengaturan Profil</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition flex items-center gap-2 border border-blue-100"
                            >
                                <Icons.Edit /> Edit Profil
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MAIN LAYOUT (GRID) --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* === KOLOM KIRI: KARTU IDENTITAS === */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center sticky top-24">
                            
                            {/* FOTO PROFIL */}
                            <div className="relative mb-6">
                                <div 
                                    onClick={triggerFileSelect}
                                    className={`w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100
                                        ${isEditing ? 'cursor-pointer ring-2 ring-blue-500 ring-offset-2 hover:opacity-90' : ''}`}
                                >
                                    {getPhotoUrl() ? (
                                        <img src={getPhotoUrl()} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-4xl font-bold">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md border-2 border-white pointer-events-none">
                                        <Icons.Camera />
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />

                            <h2 className="text-xl font-bold text-slate-800 text-center">{user.name}</h2>
                            <p className="text-slate-500 text-sm mb-4">{user.email}</p>
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6
                                ${user.role === 'penjual' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {user.role}
                            </span>

                            {/* --- INFO META --- */}
                            <div className="w-full border-t border-slate-100 pt-4 space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Bergabung</span>
                                    <span className="text-slate-700 font-medium">
                                        {new Date(user.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === KOLOM KANAN: FORM DETAIL === */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-base font-bold text-slate-800">Informasi Pribadi</h3>
                                <p className="text-xs text-slate-500">Perbarui data diri dan informasi kontak Anda.</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Nama & Nomor KK */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Nama Lengkap</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.User /></div>
                                            <input 
                                                type="text" name="name" value={user.name} onChange={handleChange} disabled={!isEditing}
                                                className={`pl-10 w-full py-2.5 rounded-lg text-sm border transition
                                                    ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Nomor KK</label>
                                        <input 
                                            type="text" name="nomor_kk" value={user.nomor_kk || ''} onChange={handleChange} disabled={!isEditing} placeholder="-"
                                            className={`w-full px-4 py-2.5 rounded-lg text-sm border transition
                                                ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                        />
                                    </div>
                                </div>

                                {/* Email & HP */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icons.Mail /></div>
                                            <input 
                                                type="email" value={user.email} disabled
                                                className="pl-10 w-full py-2.5 rounded-lg text-sm border border-slate-200 bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">No. Telepon / WA</label>
                                        <input 
                                            type="text" name="phone" value={user.phone || ''} onChange={handleChange} disabled={!isEditing} placeholder="-"
                                            className={`w-full px-4 py-2.5 rounded-lg text-sm border transition
                                                ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                        />
                                    </div>
                                </div>

                                {/* Jenis Kelamin & Tanggal Lahir */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Jenis Kelamin</label>
                                        {isEditing ? (
                                            <select name="jenis_kelamin" value={user.jenis_kelamin || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg text-sm border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                                                <option value="">- Pilih -</option>
                                                <option value="Laki-laki">Laki-laki</option>
                                                <option value="Perempuan">Perempuan</option>
                                            </select>
                                        ) : (
                                            <div className="w-full px-4 py-2.5 rounded-lg text-sm border border-transparent bg-slate-50 text-slate-800 font-medium">
                                                {user.jenis_kelamin || '-'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Tanggal Lahir</label>
                                        <input 
                                            type="date" name="tanggal_lahir" value={user.tanggal_lahir || ''} onChange={handleChange} disabled={!isEditing}
                                            className={`w-full px-4 py-2.5 rounded-lg text-sm border transition
                                                ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Bio</label>
                                        <textarea 
                                            name="bio" rows="2" value={user.bio || ''} onChange={handleChange} disabled={!isEditing} placeholder="Ceritakan sedikit tentang Anda..."
                                            className={`w-full px-4 py-3 rounded-lg text-sm border transition resize-none
                                                ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Identitas Warga & KTP */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Icons.Card /> Identitas Warga & KTP
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">NIK</label>
                                            <input 
                                                type="text" name="nik" value={user.nik || ''} onChange={handleChange} disabled={!isEditing} placeholder="-"
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm border transition
                                                    ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Dusun / RT / RW</label>
                                            <input 
                                                type="text" name="dusun_rt_rw" value={user.dusun_rt_rw || ''} onChange={handleChange} disabled={!isEditing} placeholder="-"
                                                className={`w-full px-4 py-2.5 rounded-lg text-sm border transition
                                                    ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                            />
                                        </div>
                                    </div>

                                    {/* === AREA UPLOAD KTM === */}
                                    <div className="w-full">
                                        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Kartu Tanda Penduduk (KTP)</label>
                                        
                                        <div 
                                            onClick={triggerKtmSelect}
                                            className={`relative w-full h-48 rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all
                                                ${isEditing ? 'border-dashed border-blue-300 bg-blue-50 cursor-pointer hover:bg-blue-100' : 'border-slate-200 bg-slate-50'}`}
                                        >
                                            {getKtmUrl() ? (
                                                <img src={getKtmUrl()} alt="KTP" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <div className="mx-auto w-12 h-12 text-slate-300 mb-2">
                                                        <Icons.Card className="w-12 h-12" />
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium">Belum ada foto KTP</p>
                                                    {isEditing && <p className="text-xs text-blue-500 mt-1">Klik untuk upload</p>}
                                                </div>
                                            )}

                                            {isEditing && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition-all group">
                                                    <div className="bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Icons.Upload />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={ktmInputRef} onChange={handleKtmChange} className="hidden" accept="image/*" />
                                        {isEditing && <p className="text-xs text-slate-400 mt-2">*Format: JPG, PNG. Maks 2MB.</p>}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Alamat Lengkap</label>
                                    <textarea 
                                        name="address" rows="3" value={user.address || ''} onChange={handleChange} disabled={!isEditing} placeholder="-"
                                        className={`w-full px-4 py-3 rounded-lg text-sm border transition resize-none
                                            ${isEditing ? 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' : 'border-transparent bg-slate-50 text-slate-800 font-medium'}`}
                                    ></textarea>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => { 
                                            setIsEditing(false); 
                                            setPhotoFile(null); 
                                            setKtmFile(null);
                                            fetchProfile(); 
                                        }} 
                                        className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:border-slate-300 border border-transparent transition"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Menyimpan...' : <><Icons.Save /> Simpan Perubahan</>}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                </div>
            </div>

            {/* --- TOAST NOTIFICATION --- */}
            {toast.show && (
                <div className="fixed top-24 right-4 z-50 animate-fade-in-down">
                    <div className={`shadow-lg rounded-lg border-l-4 p-4 flex items-center gap-3 min-w-[300px] bg-white
                        ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            <span className="font-bold text-lg">
                                {toast.type === 'success' ? '✓' : '!'}
                            </span>
                        </div>
                        
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm">
                                {toast.type === 'success' ? 'Berhasil!' : 'Gagal!'}
                            </h4>
                            <p className="text-gray-600 text-xs">{toast.message}</p>
                        </div>
                        
                        <button 
                            onClick={() => setToast({ ...toast, show: false })} 
                            className="text-gray-400 hover:text-gray-600 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
