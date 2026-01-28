import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Ikon SVG (Ditambah Icon Location)
const Icons = {
    Back: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    Calendar: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>,
    IdCard: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.5 2-2 2h4c-1.5 0-2-1.116-2-2z"></path></svg>,
    Verified: () => <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>,
    Location: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
};

export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicProfile = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/user/${id}/public-profile`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Accept': 'application/json' 
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setProfile(data.data);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicProfile();
    }, [id]);

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        return photo.startsWith('http') ? photo : `http://127.0.0.1:8000/storage/${photo}`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
    
    if (!profile) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-500">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-xl font-bold">Pengguna tidak ditemukan</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                <Icons.Back /> Kembali
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            
            {/* --- HEADER COVER (Gradient) --- */}
            <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                <div className="max-w-6xl mx-auto px-4 h-full relative">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="absolute top-6 left-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition flex items-center gap-2"
                    >
                        <Icons.Back /> Kembali
                    </button>
                </div>
            </div>

            {/* --- MAIN CONTENT (Grid Layout) --- */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* === KOLOM KIRI: KARTU PROFIL === */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center sticky top-24">
                            
                            {/* FOTO PROFIL */}
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden mb-4">
                                {getPhotoUrl(profile.profile_photo) ? (
                                    <img src={getPhotoUrl(profile.profile_photo)} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400">
                                        {profile.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 justify-center mb-1">
                                <h1 className="text-xl font-bold text-gray-800">{profile.name}</h1>
                                {profile.ktm_image && <Icons.Verified />}
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-4">{profile.role === 'penjual' ? 'Seller' : 'Buyer'}</p>

                            <div className="w-full border-t border-gray-100 my-4"></div>

                            {/* Detail Singkat */}
                            <div className="w-full space-y-3 text-left">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 flex-shrink-0">
                                        <Icons.Calendar />
                                    </div>
                                    <span>Bergabung {new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                                </div>

                                {/* --- BAGIAN ALAMAT (BARU) --- */}
                                {profile.address && (
                                    <div className="flex items-start gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                                            <Icons.Location />
                                        </div>
                                        <span className="leading-snug">{profile.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* === KOLOM KANAN: DETAIL & KTM === */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* 1. SECTION TENTANG SAYA */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
                                Tentang Saya
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {profile.bio || "Pengguna ini belum menambahkan bio."}
                            </p>
                        </div>

                        {/* 2. SECTION DATA AKADEMIK */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
                                Informasi Akademik
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">NPM / NIM</p>
                                    <p className="text-gray-800 font-medium">{profile.npm || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Jenis Kelamin</p>
                                    <p className="text-gray-800 font-medium">{profile.jenis_kelamin || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* 3. SECTION VERIFIKASI KTM */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                    <Icons.IdCard /> Verifikasi Mahasiswa
                                </h3>
                                {profile.ktm_image ? (
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Terverifikasi</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Belum Upload</span>
                                )}
                            </div>

                            {profile.ktm_image ? (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-3">Kartu Tanda Mahasiswa (KTM):</p>
                                    <div 
                                        className="w-full max-w-md h-56 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 relative group cursor-zoom-in mx-auto"
                                        onClick={() => window.open(getPhotoUrl(profile.ktm_image), '_blank')}
                                    >
                                        <img 
                                            src={getPhotoUrl(profile.ktm_image)} 
                                            alt="KTM Mahasiswa" 
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-gray-800 text-xs px-3 py-1.5 rounded-full font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                🔍 Lihat Ukuran Penuh
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                        <span className="text-2xl opacity-50">🆔</span>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">Pengguna belum mengunggah KTM</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}