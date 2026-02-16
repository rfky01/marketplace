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

    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

// --- STATE FITUR LUPA PASSWORD  ---
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotPhone, setForgotPhone] = useState('');
    const [targetUserName, setTargetUserName] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); 

        try {
            const response = await fetch('http://127.0.0.1:8000/login-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            // --- CEK STATUS RESPON ---
            if (response.ok) {
                // ===========================
                // JIKA LOGIN SUKSES (Code 200)
                // ===========================
                const token = data.token || data.access_token;
                const userData = data.user || data.data;

                if (token) {
                    console.log("Login Sukses, Token:", token);
                    localStorage.setItem('token', token);
                    
                    if (userData) {
                        localStorage.setItem('user', JSON.stringify(userData));
                        setUserName(userData.name);
                    }

                    // 1. Matikan Loading
                    setIsLoading(false); 
                    // 2. Tampilkan Modal Sukses (Hijau)
                    setShowWelcomeModal(true);
                    // 3. Pastikan Modal Error (Merah) Tertutup
                    setShowErrorModal(false); 

                    // 4. Redirect
                    setTimeout(() => {
                        console.log("Mengecek tujuan redirect...", data);
                        if (data.redirect_url) {
                            window.location.href = data.redirect_url;
                        } else if (userData && userData.role === 'admin') {
                            window.location.href = '/admin/dashboard';
                        } else {
                            window.location.href = '/';
                        }
                    }, 1500);
                } else {
                    // Kasus aneh: Sukses tapi tidak ada token
                    setIsLoading(false);
                    setErrorMessage("Respon server sukses, tapi Token kosong.");
                    setShowErrorModal(true);
                }

            } else {
                // ===========================
                // JIKA LOGIN GAGAL (Code 401/404)
                // ===========================
                // Kode ini yang sebelumnya HILANG di kode Anda
                
                setIsLoading(false); // <--- PENTING: Matikan loading!
                setErrorMessage(data.message || "Login gagal."); 
                setShowErrorModal(true); // Tampilkan Modal Merah
            }

        } catch (error) {
            // ===========================
            // JIKA ERROR KONEKSI / SERVER MATI
            // ===========================
            setIsLoading(false); 
            setErrorMessage("Terjadi kesalahan koneksi ke server.");
            setShowErrorModal(true);
            console.error('Error Fetch:', error);
        }
    };

    const closeErrorModal = () => {
        setShowErrorModal(false);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/forgot-password-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ phone: forgotPhone })
            });
            const data = await response.json();
            
            if (response.ok) {
                if (data.username) {
                    setTargetUserName(data.username);
                }
                alert("OTP Terkirim ke WhatsApp!");
                setForgotStep(2); // Pindah ke layar input OTP
            } else {
                alert(data.message || "Nomor tidak ditemukan.");
            }
        } catch (error) {
            alert("Gagal koneksi server.");
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            alert("Konfirmasi password tidak cocok!");
            return;
        }
        setForgotLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/reset-password-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ 
                    phone: forgotPhone,
                    otp: otpCode,
                    password: newPassword,
                    password_confirmation: confirmNewPassword
                })
            });
            const data = await response.json();
            
            if (response.ok) {
                alert("Sukses! Password berhasil diubah. Silakan Login.");
                setIsForgotModalOpen(false);
                setForgotStep(1); 
                setForgotPhone('');
                setOtpCode('');
                setNewPassword('');
                setConfirmNewPassword('');
                setTargetUserName('');
            } else {
                alert(data.message || "Gagal mengubah password.");
            }
        } catch (error) {
            alert("Terjadi kesalahan.");
        } finally {
            setForgotLoading(false);
        }
    };

    const EyeIcon = ({ isVisible, toggleVisibility }) => (
        <button
            type="button"
            onClick={toggleVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-600 focus:outline-none"
        >
            {isVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
            )}
        </button>
    );

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

                    <div className="flex justify-end">
                        <button 
                            type="button" 
                            onClick={() => setIsForgotModalOpen(true)}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Lupa Password?
                        </button>
                    </div>

                    {/* --- AREA TOMBOL (GAP DIKURANGI) --- */}
                    <div className="flex flex-col gap-3 pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Memuat..." : "Masuk"}
                        </button>

                        <Link 
                            to="/" 
                            className="block w-full text-center py-3 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition duration-200 decoration-none"
                        >
                            Masuk Sebagai Tamu
                        </Link>
                    </div>
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

            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative animate-slide-in">
                        <button onClick={() => setIsForgotModalOpen(false)} className="absolute top-4 right-4 text-gray-400 font-bold hover:text-red-500">✕</button>

                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {forgotStep === 1 ? "Reset Password via WA" : "Buat Password Baru"}
                        </h3>

                        {forgotStep === 1 ? (
                            <form onSubmit={handleSendOtp}>
                                <p className="text-sm text-gray-500 mb-4">Masukkan nomor WhatsApp terdaftar.</p>
                                <input type="tel" className="w-full border rounded-lg px-3 py-2 mb-4" placeholder="08xxxxxxxxxx" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} required />
                                <button type="submit" disabled={forgotLoading} className="w-full bg-green-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">{forgotLoading ? "Mengirim..." : "Kirim Kode OTP"}</button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <p className="text-sm text-gray-500 mb-4">Kode OTP telah dikirim ke <b>{forgotPhone}</b></p>
                                
                                <div className="mb-4 text-center bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <span className="font-bold text-blue-900 text-lg block">{targetUserName || 'Pengguna'}</span>
                                </div>
                                
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Kode OTP</label>
                                    <input 
                                        type="text" 
                                        name="otp_code" // 1. Berikan nama unik (jangan 'email' atau kosong)
                                        autoComplete="one-time-code" // 2. Ini SANGAT PENTING untuk mencegah autofill email
                                        className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest font-bold" 
                                        placeholder="XXXXXX" 
                                        value={otpCode} 
                                        onChange={(e) => setOtpCode(e.target.value)} 
                                        required 
                                    />
                                </div>

                                {/* PASSWORD BARU (DENGAN MATA) */}
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Password Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            className="w-full border rounded-lg px-3 py-2 pr-10" 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)} 
                                            placeholder="Minimal 8 karakter" 
                                            required 
                                        />
                                        <EyeIcon isVisible={showNewPassword} toggleVisibility={() => setShowNewPassword(!showNewPassword)} />
                                    </div>
                                </div>

                                {/* KONFIRMASI PASSWORD (DENGAN MATA) */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Ulangi Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmNewPassword ? "text" : "password"} 
                                            className="w-full border rounded-lg px-3 py-2 pr-10" 
                                            value={confirmNewPassword} 
                                            onChange={(e) => setConfirmNewPassword(e.target.value)} 
                                            placeholder="Konfirmasi password" 
                                            required 
                                        />
                                        <EyeIcon isVisible={showConfirmNewPassword} toggleVisibility={() => setShowConfirmNewPassword(!showConfirmNewPassword)} />
                                    </div>
                                </div>

                                <button type="submit" disabled={forgotLoading} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">{forgotLoading ? "Menyimpan..." : "Simpan Password Baru"}</button>
                            </form>
                        )}
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