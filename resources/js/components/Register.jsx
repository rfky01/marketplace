import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import suksesImg from './asset/sukses.png';
import salahImg from './asset/salah.png'; 

// Import icon mata (Opsional: Jika pakai heroicons/react-icons, bisa import dari situ.
// Di sini saya pakai SVG inline agar tidak perlu install library tambahan)

export default function Register() {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        address: '',
    });

    // --- STATE BARU: SHOW PASSWORD ---
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- STATE VISUAL (LOADING & POPUP) ---
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false); 
    const [errorMessage, setErrorMessage] = useState('');        
    const [isLoading, setIsLoading] = useState(false);
    // --------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); 

        try {
            const response = await fetch('http://127.0.0.1:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            
            if (response.ok) {
                setIsLoading(false); 
                setShowSuccessModal(true); 

                setTimeout(() => {
                    navigate('/login'); 
                }, 2000); 

            } else {
                setIsLoading(false); 
                let msg = data.message || JSON.stringify(data.errors);
                setErrorMessage(msg);
                setShowErrorModal(true); 
            }
        } catch (error) {
            setIsLoading(false); 
            console.error('Error:', error);
            setErrorMessage('Terjadi kesalahan koneksi ke server.');
            setShowErrorModal(true);
        }
    };

    const closeErrorModal = () => {
        setShowErrorModal(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 relative">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-200">
                <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-6">Daftar Akun Baru</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input type="text" name="name" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
                            <input type="text" name="phone" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
                        <input type="email" name="email" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                        <textarea name="address" rows="2" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required></textarea>
                    </div>

                    {/* --- AREA PASSWORD (DIPERBAIKI) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type={showPassword ? "text" : "password"} // Logic type
                                name="password" 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                required 
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                            <input 
                                type={showPassword ? "text" : "password"} // Logic type
                                name="password_confirmation" 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                required 
                            />
                        </div>
                    </div>

                    {/* --- CHECKBOX SHOW PASSWORD --- */}
                    <div className="flex items-center">
                        <input 
                            id="show-pass" 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        <label htmlFor="show-pass" className="ml-2 text-sm text-gray-600 cursor-pointer select-none">
                            Tampilkan Password
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Memproses..." : "Daftar Sekarang"}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6 text-sm">
                    Sudah punya akun? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login disini</Link>
                </p>
            </div>

            {/* --- LOADING SPINNER --- */}
            {isLoading && !showErrorModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-3"></div>
                        <p className="text-gray-700 font-bold text-sm">Mendaftarkan Akun...</p>
                    </div>
                </div>
            )}

            {/* --- POPUP MODAL SUKSES --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform scale-100 transition-transform duration-300">
                        <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center relative">
                            <img
                                src={suksesImg} 
                                alt="Register Berhasil"
                                className="w-full h-full object-contain animate-bounce-in drop-shadow-lg"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/148/148767.png"; }}
                            />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrasi Berhasil!</h2>
                        <p className="text-gray-600 mb-6">
                            Akun Anda telah dibuat. Silakan login untuk melanjutkan.
                        </p>
                        
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div 
                                className="bg-green-500 h-1.5 rounded-full" 
                                style={{ width: '100%', transition: 'width 2s ease-in-out' }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400">Mengalihkan ke halaman login...</p>
                    </div>
                </div>
            )}

            {/* --- POPUP MODAL ERROR --- */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-shake">
                        
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <img
                                src={salahImg} 
                                alt="Register Gagal"
                                className="w-full h-full object-contain animate-bounce-in drop-shadow-lg"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/1828/1828843.png"; }}
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrasi Gagal</h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            {errorMessage}
                        </p>

                        <button 
                            onClick={closeErrorModal} 
                            className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition shadow-lg active:scale-95"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}