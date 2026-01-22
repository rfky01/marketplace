import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AddProduct() {
    const navigate = useNavigate();

    // State Data Produk
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Elektronik');
    const [description, setDescription] = useState('');
    
    // State Khusus Upload & Loading
    const [files, setFiles] = useState([]); // Menampung array file
    const [previews, setPreviews] = useState([]); // Menampung URL preview
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    // Handle File Change (Multiple)
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);

        // Buat URL preview
        const filePreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviews(filePreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); // Aktifkan loading
        setErrors([]);

        const formData = new FormData();
        formData.append('nama_barang', name);
        formData.append('harga_barang', price);
        formData.append('stok_barang', stock);
        formData.append('kategori', category);
        formData.append('deskripsi', description);

        // --- PERBAIKAN DI SINI ---
        // Loop file dan masukkan ke formData dengan nama array 'foto_barang[]'
        // Gunakan variabel 'formData', BUKAN 'data'
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
                    // Jangan set Content-Type manual untuk FormData
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert('Produk berhasil diupload!');
                navigate('/'); 
            } else {
                setErrors(result.errors || { message: [result.message] });
            }

        } catch (error) {
            console.error("Error uploading product:", error);
            alert("Terjadi kesalahan koneksi.");
        } finally {
            setIsLoading(false); // Matikan loading
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Upload Produk Baru</h2>
                    <Link to="/" className="text-gray-500 hover:text-gray-700">Batal</Link>
                </div>

                {/* Tampilkan Error jika ada */}
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
                    {/* Nama Barang */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Nama produk anda" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Harga */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="1000000" required />
                        </div>
                        {/* Stok */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="10" required />
                        </div>
                    </div>

                    {/* Kategori */}
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

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Jelaskan detail produk Anda..." required></textarea>
                    </div>

                    {/* Foto Barang (Multiple) */}
                    <div>
                        <label className="block font-bold mb-1 text-sm text-gray-600">Foto Produk (Bisa pilih banyak)</label>
                        <input 
                            type="file" 
                            multiple 
                            onChange={handleFileChange} 
                            className="w-full border p-2 rounded"
                            accept="image/*"
                        />
                        <p className="text-xs text-gray-400 mt-1">*Tekan Ctrl saat memilih file untuk upload lebih dari satu.</p>
                    </div>

                    {/* --- PREVIEW GRID --- */}
                    {previews.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {previews.map((src, index) => (
                                <img key={index} src={src} alt="Preview" className="w-full h-20 object-cover rounded border" />
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
        </div>
    );
}