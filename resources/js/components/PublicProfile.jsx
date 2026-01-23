import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PublicProfile() {
    const { id } = useParams(); // Ambil ID dari URL
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

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    
    if (!profile) return (
        <div className="flex flex-col items-center justify-center h-screen text-gray-500">
            <p className="text-xl font-bold">Pengguna tidak ditemukan 😔</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline">Kembali</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Header / Cover Area */}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                    <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition">
                        ← Kembali
                    </button>
                </div>

                <div className="px-8 pb-8">
                    {/* Foto Profil & Info Utama */}
                    <div className="relative -mt-16 flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                            {getPhotoUrl(profile.profile_photo) ? (
                                <img src={getPhotoUrl(profile.profile_photo)} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-400">
                                    {profile.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        
                        <h1 className="mt-4 text-2xl font-bold text-gray-800">{profile.name}</h1>
                        
                        {/* --- BAGIAN NPM DITAMBAHKAN DI SINI --- */}
                        <p className="text-sm text-gray-600 font-semibold mb-1">
                            {profile.npm || profile.nim || "-"} 
                        </p>
                        {/* -------------------------------------- */}

                        <p className="text-gray-500">{profile.email}</p>
                        
                        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                            ${profile.role === 'penjual' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {profile.role}
                        </span>
                    </div>

                    {/* Detail Info */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Tentang Saya</h3>
                            <p className="text-gray-700 leading-relaxed">
                                {profile.bio || "Pengguna ini belum menulis bio."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Fakultas</h3>
                                <p className="font-medium text-gray-800">{profile.fakultas || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Program Studi</h3>
                                <p className="font-medium text-gray-800">{profile.prodi || "-"}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Jenis Kelamin</h3>
                                <p className="font-medium text-gray-800">{profile.jenis_kelamin || "-"}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Bergabung Sejak</h3>
                                <p className="font-medium text-gray-800">
                                    {new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}