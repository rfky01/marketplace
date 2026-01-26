import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCroppedImg } from './canvasUtils';
import Cropper from 'react-easy-crop'; // IMPORT TAMBAHAN

export default function AddProduct() {
    const navigate = useNavigate();

    // State Data Produk (TETAP SAMA)
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Elektronik');
    const [description, setDescription] = useState('');
    
    // State Khusus Upload & Loading (TETAP SAMA)
    const [files, setFiles] = useState([]); 
    const [previews, setPreviews] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    // --- STATE POPUP SUKSES (TETAP SAMA) ---
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showProfileWarning, setShowProfileWarning] = useState(false);

    // --- STATE BARU UNTUK CROPPER ---
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // --- PENGECEKAN PROFIL LENGKAP (BARU) ---
    useEffect(() => {
        const checkProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/login');
                    return;
                }

                // 1. Ambil data user TERBARU dari server (agar tidak kena cache lama)
                // Pastikan route '/api/user' tersedia di Laravel (biasanya default Sanctum)
                const response = await fetch('http://127.0.0.1:8000/api/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Normalisasi: Kadang Laravel membungkus dalam { data: ... }
                    const userFixed = data.data || data; 

                    // 2. Update Local Storage agar sinkron
                    localStorage.setItem('user', JSON.stringify(userFixed));

                    // 3. Cek Kelengkapan (Prioritaskan data server)
                    // Cek 'telepon' (sesuai DB) atau 'phone' (kadang beda mapping)
                    const telp = userFixed.telepon || userFixed.phone || userFixed.no_hp;
                    const almt = userFixed.address || userFixed.alamat;
                    const ktm = userFixed.ktm_image;
                    const npm = userFixed.npm

                    if (!telp || !almt || !ktm || !npm) {
                        setShowProfileWarning(true);
                    }
                } else {
                    // Fallback: Jika gagal fetch (misal offline), pakai data LocalStorage lama
                    const localData = localStorage.getItem('user');
                    if (localData) {
                        const user = JSON.parse(localData);
                        if (!user.phone || !user.address) setShowProfileWarning(true);
                    }
                }

            } catch (error) {
                console.error("Error checking profile:", error);
            }
        };

        checkProfile();
    }, [navigate]);

    // Helper: Baca file jadi base64 agar bisa dicrop
    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    // MODIFIKASI: Handle File Change sekarang membuka Cropper dulu
    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageData = await readFile(file);
            setImageSrc(imageData); // Buka Modal Crop
            e.target.value = null; // Reset input agar bisa pilih file yang sama jika mau
        }
    };

    // FUNGSI BARU: Simpan posisi crop
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // FUNGSI BARU: Eksekusi hasil potong & masukkan ke state 'files' Anda
    const showCroppedImage = async () => {
        try {
            // 1. Buat file baru hasil crop
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            // 2. Buat URL preview
            const previewUrl = URL.createObjectURL(croppedImageBlob);
            
            // 3. Masukkan ke state 'files' dan 'previews' milik Anda (APPEND/MENAMBAHKAN)
            setFiles(prev => [...prev, croppedImageBlob]);
            setPreviews(prev => [...prev, previewUrl]);
            
            // 4. Tutup Cropper
            setImageSrc(null); 
            setZoom(1);
        } catch (e) {
            console.error(e);
        }
    };

    // Fungsi Hapus Gambar (Tambahan agar user bisa batal upload 1 foto)
    const removeImage = (index) => {
        setFiles(files.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    // handleSubmit (TETAP SAMA PERSIS LOGIKANYA)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); 
        setErrors([]);

        const formData = new FormData();
        formData.append('nama_barang', name);
        formData.append('harga_barang', price);
        formData.append('stok_barang', stock);
        formData.append('kategori', category);
        formData.append('deskripsi', description);

        files.forEach((file) => {
            formData.append('foto_barang[]', file);
        });

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/produk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json' 
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                setShowSuccessModal(true);
            } else {
                setErrors(result.errors || { message: [result.message] });
            }

        } catch (error) {
            console.error("Error uploading product:", error);
            alert("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 relative">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Upload Produk Baru</h2>
                    <Link to="/" className="text-gray-500 hover:text-gray-700">Batal</Link>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                        <ul className="list-disc list-inside">
                            {Object.values(errors).flat().map((err, index) => (
                                <li key={index}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* INPUT FORM STANDAR (TETAP SAMA) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Nama produk anda" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="1000000" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="10" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-2 rounded bg-white focus:ring-2 focus:ring-blue-500">
                            <option value="Buku">Buku</option>
                            <option value="Pakaian">Pakaian</option>
                            <option value="Makanan">Makanan</option>
                            <option value="Perlengkapan">Perlengkapan</option>
                            <option value="Elektronik">Elektronik</option>
                            <option value="Kecantikan">Kecantikan</option>
                            <option value="Lainnya">Lainnya...</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Jelaskan detail produk Anda..." required></textarea>
                    </div>

                    {/* --- MODIFIKASI: INPUT FILE MENJADI TRIGGER CROPPER --- */}
                    <div>
                        <label className="block font-bold mb-1 text-sm text-gray-600">Foto Produk</label>
                        <input 
                            type="file" 
                            // Hapus 'multiple' agar flow crop satu-persatu lebih enak (opsional, tapi disarankan)
                            onChange={handleFileChange} 
                            className="w-full border p-2 rounded"
                            accept="image/*"
                        />
                        <p className="text-xs text-gray-400 mt-1">*Pilih foto satu per satu untuk menyesuaikan posisi (Crop).</p>
                    </div>

                    {/* --- PREVIEW GRID DENGAN TOMBOL HAPUS --- */}
                    {previews.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {previews.map((src, index) => (
                                <div key={index} className="relative group">
                                    <img 
                                        src={src} 
                                        alt="Preview" 
                                        className="w-full h-20 object-contain bg-gray-50 rounded border" 
                                    />
                                    {/* Tombol X kecil untuk hapus gambar */}
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition shadow-lg mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sedang Upload...' : 'Upload Sekarang'}
                    </button>
                </form>
            </div>

            {/* --- MODAL SUKSES (TETAP SAMA) --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform scale-100 transition-all">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 text-green-600">
                            <span className="text-3xl font-bold">✓</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Upload Berhasil!</h3>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            Produk Anda berhasil ditambahkan dan siap dijual.
                        </p>
                        <button 
                            onClick={() => navigate('/')} 
                            className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* --- [BARU] MODAL PERINGATAN PROFIL BELUM LENGKAP --- */}
            {showProfileWarning && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border-t-4 border-orange-500 transform scale-100 transition-all">
                        
                        {/* Ikon Peringatan */}
                        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Profil Belum Lengkap</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Anda belum bisa mengupload produk. Harap lengkapi <b>Alamat</b> dan <b>Nomor Telepon</b> Anda terlebih dahulu.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => navigate('/profile')} 
                                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105"
                            >
                                Lengkapi Profil Sekarang
                            </button>
                            <button 
                                onClick={() => navigate('/')} 
                                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                            >
                                Kembali ke Beranda
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CROPPER (BARU - DITAURUH DI LUAR FORM) --- */}
            {imageSrc && (
                <div className="fixed inset-0 z-[200] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-lg h-96 bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1 / 1} // RASIO KOTAK (Agar rapi di kolom)
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    
                    <div className="mt-4 w-full max-w-lg flex items-center gap-4">
                        <span className="text-white text-sm font-bold">Zoom:</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="mt-6 flex gap-4">
                        <button 
                            onClick={() => setImageSrc(null)} // Batal
                            className="px-6 py-2 bg-white text-gray-800 font-bold rounded-full hover:bg-gray-200"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={showCroppedImage} // Simpan
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 shadow-lg"
                        >
                            Potong & Simpan
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}