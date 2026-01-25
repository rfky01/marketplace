import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();

    // State Form
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // State OTP
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false); // Apakah OTP sudah dikirim?
    const [otpLoading, setOtpLoading] = useState(false); // Loading saat kirim WA
    const [timer, setTimer] = useState(0); // Timer hitung mundur (opsional)

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    // --- STATE BARU: TOAST (Pojok Kanan Atas) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- STATE BARU: MODAL SUKSES (Tengah) ---
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Effect: Auto-hide Toast setelah 3 detik
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // Fungsi Kirim OTP
    const handleSendOtp = async () => {
        if (!phone) {
            alert("Masukkan nomor HP terlebih dahulu!");
            return;
        }

        setOtpLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ no_hp: phone })
            });

            const data = await response.json();

            if (response.ok) {
                setOtpSent(true);
                // Tampilkan Toast Sukses
                setToast({ show: true, message: "Kode OTP terkirim ke WhatsApp!", type: 'success' });
            } else {
                setToast({ show: true, message: data.message || "Gagal kirim OTP", type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: "Terjadi kesalahan koneksi", type: 'error' });
        } finally {
            setOtpLoading(false);
        }
    };

    // Fungsi Register Utama
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors([]);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    password_confirmation: confirmPassword,
                    no_hp: phone,
                    alamat: address,
                    otp: otp 
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Simpan token & Redirect
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.data));
                
                // Tampilkan Modal Sukses
                setShowSuccessModal(true);
            } else {
                // Tampilkan error
                if (typeof data === 'object' && data !== null) {
                    setErrors(Object.values(data).flat());
                } else {
                    setErrors([data.message]);
                }
                setToast({ show: true, message: "Registrasi Gagal. Periksa inputan.", type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: "Terjadi kesalahan sistem", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            
            {/* --- [TAMBAHAN 1] UI TOAST NOTIFICATION (POJOK KANAN ATAS) --- */}
            {toast.show && (
                <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-lg shadow-xl text-white font-semibold transition-all transform translate-y-0 opacity-100 flex items-center gap-3 animate-fade-in-down
                    ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
                    {toast.message}
                </div>
            )}

            {/* --- [TAMBAHAN 2] UI MODAL POPUP SUKSES (TENGAH LAYAR) --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center transform scale-100 transition-all">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Registrasi Berhasil!</h3>
                        <p className="text-gray-500 mb-8">
                            Selamat datang, {name}! Akun Anda telah aktif.
                        </p>
                        <button 
                            onClick={() => navigate('/login')} // Sesuaikan redirect
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
                        >
                            Lanjut ke Login →
                        </button>
                    </div>
                </div>
            )}

            {/* --- FORM REGISTRASI (KODE ASLI ANDA) --- */}
            <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
                        Daftar Akun Baru
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Lengkapi data diri Anda di bawah ini
                    </p>
                </div>

                {errors.length > 0 && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        <ul className="list-disc list-inside">
                            {errors.map((err, index) => <li key={index}>{err}</li>)}
                        </ul>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Nama Lengkap */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Nama Lengkap"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Nomor HP & Tombol OTP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nomor HP (WhatsApp)</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    required
                                    className="flex-1 block w-full min-w-0 px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="08xxxxxxxxxx"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={otpLoading || !phone}
                                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {otpLoading ? 'Mengirim...' : 'Kirim OTP'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Input OTP (Hanya Muncul Jika OTP Sudah Dikirim) */}
                    {otpSent && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 animate-fade-in">
                            <label className="block text-sm font-bold text-blue-800 mb-1">
                                Masukkan Kode OTP
                            </label>
                            <p className="text-xs text-blue-600 mb-2">Kode telah dikirim ke WhatsApp {phone}</p>
                            <input
                                type="text"
                                required
                                className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center tracking-widest font-bold text-lg"
                                placeholder="X X X X X X"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                            />
                        </div>
                    )}

                    {/* Alamat Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Alamat Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="nama@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Alamat Lengkap */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Alamat Lengkap</label>
                        <textarea
                            required
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Jalan, Kelurahan, Kecamatan..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    {/* Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="show-password"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        <label htmlFor="show-password" class="ml-2 block text-sm text-gray-900">
                            Tampilkan Password
                        </label>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg"
                        >
                            {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Masuk di sini
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}