import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Cropper from 'react-easy-crop'; // IMPORT BARU
import { getCroppedImg } from './canvasUtils'; // IMPORT BARU (Sesuaikan path jika perlu)

export default function EditProduct() {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const [loading, setLoading] = useState(true);
    
    // State Form (TETAP SAMA)
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Elektronik');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null); 
    const [previewImage, setPreviewImage] = useState(''); 
    const [errors, setErrors] = useState([]);

    const [existingImages, setExistingImages] = useState([]); 
    const [newFiles, setNewFiles] = useState([]); 
    const [newPreviews, setNewPreviews] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // --- STATE TOAST (TETAP SAMA) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // --- STATE BARU UNTUK CROPPER ---
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // --- EFFECT: AUTO-CLOSE TOAST (TETAP SAMA) ---
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000); 
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // 1. Ambil Data Produk Lama (TETAP SAMA)
    useEffect(() => {
        fetchProductData();
    }, []);

    const fetchProductData = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${id}`);
            const data = await response.json();
            if (data.success) {
                const p = data.data;
                setName(p.nama_barang);
                setPrice(p.harga_barang);
                setStock(p.stok_barang);
                setCategory(p.kategori);
                setDescription(p.deskripsi);
                setPreviewImage(p.foto_barang);

                if (Array.isArray(p.foto_barang)) {
                    setExistingImages(p.foto_barang);
                } else if (typeof p.foto_barang === 'string' && p.foto_barang) {
                    setExistingImages([p.foto_barang]); 
                } else {
                    setExistingImages([]);
                }

            } else {
                alert("Produk tidak ditemukan");
                navigate('/my-products');
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- HELPER CROPPER BARU ---
    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    // MODIFIKASI: Handle File Change membuka Cropper
    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageData = await readFile(file);
            setImageSrc(imageData); // Buka Modal Crop
            e.target.value = null; // Reset input
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const previewUrl = URL.createObjectURL(croppedImageBlob);
            
            // Masukkan ke state (APPEND)
            setNewFiles(prev => [...prev, croppedImageBlob]);
            setNewPreviews(prev => [...prev, previewUrl]);
            
            setImageSrc(null); 
            setZoom(1);
        } catch (e) {
            console.error(e);
        }
    };

    // Fungsi Hapus Foto Baru (Jika user salah crop)
    const removeNewImage = (index) => {
        setNewFiles(newFiles.filter((_, i) => i !== index));
        setNewPreviews(newPreviews.filter((_, i) => i !== index));
    };

    // handleSubmit (TETAP SAMA PERSIS)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('nama_barang', name);
        formData.append('harga_barang', price);
        formData.append('stok_barang', stock);
        formData.append('kategori', category);
        formData.append('deskripsi', description);
        
        formData.append('_method', 'PUT'); 

        // newFiles sekarang berisi Blob hasil crop
        if (newFiles.length > 0) {
            newFiles.forEach(file => {
                formData.append('foto_barang[]', file);
            });
        }

        // Fallback backward compatibility code lama Anda
        if (image) {
            formData.append('foto_barang', image);
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/produk/${id}`, {
                method: 'POST', 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setToast({ show: true, message: "Produk berhasil diupdate!", type: 'success' });
                setTimeout(() => {
                    navigate('/my-products');
                }, 1500); 
            } else {
                setErrors(data.errors || { message: [data.message] });
                setToast({ show: true, message: "Gagal update produk", type: 'error' });
            }
        } catch (error) {
            console.error("Error updating:", error);
            setToast({ show: true, message: "Terjadi kesalahan sistem", type: 'error' });
        } finally {
            setIsLoading(false); 
        }
    };

    if (loading) return <div className="text-center mt-20">Memuat data...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 relative">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Edit Produk</h2>
                    <Link to="/my-products" className="text-gray-500 hover:text-gray-700">Batal</Link>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                        <ul>{Object.values(errors).flat().map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nama Barang</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stok</label>
                            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-2 rounded" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Kategori</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-2 rounded bg-white">
                            <option value="Buku">Buku</option>
                            <option value="Pakaian">Pakaian</option>
                            <option value="Makanan">Makanan</option>
                            <option value="Perlengkapan">Perlengkapan</option>
                            <option value="Elektronik">Elektronik</option>
                            <option value="Kecantikan">Kecantikan</option>
                            <option value="Lainya...">Lainya...</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full border p-2 rounded" required></textarea>
                    </div>

                    {/* --- AREA GAMBAR --- */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <label className="block font-bold mb-2 text-sm text-gray-700">Foto Produk</label>
                        
                        {/* 1. TAMPILAN FOTO LAMA (Hanya muncul jika user BELUM pilih file baru) */}
                        {newFiles.length === 0 && existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 mb-2">Foto Saat Ini:</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {existingImages.map((img, index) => (
                                        <img 
                                            key={index}
                                            src={`http://127.0.0.1:8000/storage/${img}`} 
                                            alt="Existing" 
                                            className="w-20 h-20 object-contain bg-gray-50 rounded border border-gray-300"
                                            onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. INPUT FILE BARU (TRIGGER CROPPER) */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <input 
                                type="file" 
                                // Hapus multiple agar crop satu per satu
                                onChange={handleFileChange} 
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                accept="image/*"
                            />
                            <p className="text-xs text-orange-500 mt-2 italic">
                                *Mengupload foto baru akan <b>menghapus/mengganti</b> semua foto lama. Pilih satu per satu untuk menyesuaikan (Crop).
                            </p>
                        </div>

                        {/* 3. PREVIEW FOTO BARU (HASIL CROP) */}
                        {newPreviews.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-blue-600 font-bold mb-2">Preview Foto Baru (Akan Diupload):</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {newPreviews.map((src, index) => (
                                        <div key={index} className="relative group">
                                            <img 
                                                src={src} 
                                                alt="New Preview" 
                                                className="w-full h-20 object-contain bg-white rounded border border-blue-200" 
                                            />
                                            {/* Tombol Hapus per Item */}
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(index)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded transition shadow-lg mt-4 disabled:opacity-50">
                        {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </form>
            </div>

            {/* --- MODAL CROPPER (BARU) --- */}
            {imageSrc && (
                <div className="fixed inset-0 z-[200] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-lg h-96 bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1 / 1} // RASIO KOTAK
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

            {/* --- TOAST NOTIFICATION (TETAP SAMA) --- */}
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