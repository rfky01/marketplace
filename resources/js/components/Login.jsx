import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import suksesImg from './asset/sukses.png';
import salahImg from './asset/salah.png';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });

    // --- STATE VISUAL ---
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); // <--- State untuk Loading
    const [userName, setUserName] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); // 1. Mulai Loading saat tombol diklik

        try {
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            // Beri sedikit jeda buatan (opsional) agar loading terlihat halus jika internet terlalu cepat
            // await new Promise(resolve => setTimeout(resolve, 800)); 

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user) {
                    setUserName(data.user.name);
                }
                
                setIsLoading(false); // 2. Matikan Loading
                setShowWelcomeModal(true); // 3. Tampilkan Popup Selamat Datang

                setTimeout(() => {
                    navigate('/'); 
                }, 2000);

            } else {
                setIsLoading(false);
                setErrorMessage(data.message || "Email atau password salah.");
                setShowErrorModal(true);
            }
        } catch (error) {
            setIsLoading(false); // Matikan loading jika error
            setErrorMessage("Terjadi kesalahan koneksi ke server.");
            setShowErrorModal(true);
            console.error('Error:', error);
        }
    };

    const closeErrorModal = () => {
        setShowErrorModal(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 relative">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
                <h2 className="text-3xl font-extrabold text-gray-800 text-center mb-2">Selamat Datang</h2>
                <p className="text-center text-gray-500 mb-8">Silakan masuk ke akun Anda</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="email@contoh.com" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" name="password" onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="******" required />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading} // Matikan tombol saat loading
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Memuat..." : "Masuk"}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6 text-sm">
                    Belum punya akun? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Daftar disini</Link>
                </p>
            </div>

            {/* --- LOADING SPINNER (MUNCUL SEBELUM POPUP) --- */}
            {isLoading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
                        {/* Spinner Animasi */}
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-3"></div>
                        <p className="text-gray-700 font-bold text-sm">Memverifikasi...</p>
                    </div>
                </div>
            )}

            {/* --- POPUP MODAL SELAMAT DATANG --- */}
            {showWelcomeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform scale-100 transition-transform duration-300">
                        <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center relative">
                            <img
                                src={suksesImg} 
                                alt="Login Berhasil"
                                className="w-full h-full object-contain animate-bounce-in drop-shadow-lg"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Berhasil!</h2>
                        {/* Loading Bar Animasi */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: '100%', transition: 'width 2s ease-in-out' }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400">Mengalihkan ke dashboard...</p>
                    </div>
                </div>
            )}

            {/* --- POPUP MODAL ERROR (DIPERBAIKI) --- */}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-shake">
                        
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <img
                                src={salahImg} 
                                alt="Login Gagal"
                                className="w-full h-full object-contain animate-bounce-in drop-shadow-lg"
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Gagal</h2>
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