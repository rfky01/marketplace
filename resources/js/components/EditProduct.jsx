import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export default function EditProduct() {
    const navigate = useNavigate();
    const { id } = useParams(); // Ambil ID produk dari URL
    const [loading, setLoading] = useState(true);
    
    // State Form
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Elektronik');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null); // File baru (jika ada)
    const [previewImage, setPreviewImage] = useState(''); // URL gambar lama untuk preview
    const [errors, setErrors] = useState([]);

    const [existingImages, setExistingImages] = useState([]); // Foto lama dari DB
    const [newFiles, setNewFiles] = useState([]); // File baru yang akan diupload
    const [newPreviews, setNewPreviews] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // 1. Ambil Data Produk Lama saat halaman dibuka
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

                // --- LOGIKA MENANGANI FOTO (ARRAY vs STRING) ---
                if (Array.isArray(p.foto_barang)) {
                    setExistingImages(p.foto_barang);
                } else if (typeof p.foto_barang === 'string' && p.foto_barang) {
                    setExistingImages([p.foto_barang]); // Jadikan array meski cuma 1
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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewFiles(files);

        // Buat preview untuk foto baru
        const previews = files.map(file => URL.createObjectURL(file));
        setNewPreviews(previews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const token = localStorage.getItem('token');

        // Gunakan FormData karena ada file upload
        const formData = new FormData();
        formData.append('nama_barang', name);
        formData.append('harga_barang', price);
        formData.append('stok_barang', stock);
        formData.append('kategori', category);
        formData.append('deskripsi', description);
        
        // PENTING: Trik agar Laravel membaca ini sebagai PUT request
        formData.append('_method', 'PUT'); 

        if (newFiles.length > 0) {
            newFiles.forEach(file => {
                formData.append('foto_barang[]', file);
            });
        }

        if (image) {
            formData.append('foto_barang', image);
        }

        try {
            // Method tetap POST, tapi Laravel akan membacanya sebagai PUT karena ada _method
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
                alert('Produk berhasil diupdate!');
                navigate('/my-products');
            } else {
                setErrors(data.errors || { message: [data.message] });
            }
        } catch (error) {
            console.error("Error updating:", error);
        }
    };

    if (loading) return <div className="text-center mt-20">Memuat data...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
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
                            <option value="Perlengkapan">Perlengkapam</option>
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
                                            className="w-20 h-20 object-cover rounded border border-gray-300"
                                            onError={(e) => e.target.src = "https://via.placeholder.com/150"}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. INPUT FILE BARU */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                            <input 
                                type="file" 
                                multiple 
                                onChange={handleFileChange} 
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                accept="image/*"
                            />
                            <p className="text-xs text-orange-500 mt-2 italic">
                                *Mengupload foto baru akan <b>menghapus/mengganti</b> semua foto lama.
                            </p>
                        </div>

                        {/* 3. PREVIEW FOTO BARU (Jika user memilih file) */}
                        {newPreviews.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-blue-600 font-bold mb-2">Preview Foto Baru:</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {newPreviews.map((src, index) => (
                                        <img key={index} src={src} alt="New Preview" className="w-full h-20 object-cover rounded border border-blue-200" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded transition shadow-lg mt-4">
                        Simpan Perubahan
                    </button>
                </form>
            </div>
        </div>
    );
}