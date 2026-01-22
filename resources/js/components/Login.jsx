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
    const [isLoading, setIsLoading] = useState(false); 
    const [userName, setUserName] = useState('');

    // --- STATE BARU: SHOW PASSWORD ---
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); 

        try {
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user) {
                    setUserName(data.user.name);
                }
                
                setIsLoading(false); 
                setShowWelcomeModal(true); 

                setTimeout(() => {
                    navigate('/'); 
                }, 2000);

            } else {
                setIsLoading(false);
                setErrorMessage(data.message || "Email atau password salah.");
                setShowErrorModal(true);
            }
        } catch (error) {
            setIsLoading(false); 
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

                    {/* --- KOLOM PASSWORD DENGAN IKON MATA --- */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} // Logika tipe input
                                name="password" 
                                onChange={handleChange} 
                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10" // pr-10 beri ruang ikon
                                placeholder="******" 
                                required 
                            />
                            {/* Tombol Ikon Mata */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    // Ikon Mata Terbuka
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                ) : (
                                    // Ikon Mata Dicoret
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Memuat..." : "Masuk"}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6 text-sm">
                    Belum punya akun? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Daftar disini</Link>
                </p>
            </div>

            {/* --- LOADING SPINNER --- */}
            {isLoading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
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

            {/* --- POPUP MODAL ERROR --- */}
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