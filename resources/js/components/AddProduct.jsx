import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function AddProduct() {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [category, setCategory] = useState('Elektronik'); // Default kategori
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState([]);

    // Handle File Change (Khusus Gambar)
    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Siapkan FormData (Wajib untuk upload file)
        const formData = new FormData();
        formData.append('nama_barang', name);
        formData.append('harga_barang', price);
        formData.append('stok_barang', stock);
        formData.append('kategori', category);
        formData.append('deskripsi', description);
        formData.append('foto_barang', image);

        const token = localStorage.getItem('token');

        try {
            // 2. Kirim ke API Laravel
            const response = await fetch('http://127.0.0.1:8000/api/produk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // PENTING: Jangan set 'Content-Type': 'application/json' di sini!
                    // Biarkan browser yang mengatur boundary multipart/form-data otomatis.
                    'Accept': 'application/json' 
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert('Produk berhasil diupload!');
                navigate('/'); // Kembali ke Dashboard
            } else {
                // Tampilkan error validasi dari Laravel
                setErrors(data.errors || { message: [data.message] });
            }

        } catch (error) {
            console.error("Error uploading product:", error);
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
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Laptop Gaming" required />
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
                            <option value="Elektronik">Elektronik</option>
                            <option value="Pakaian">Pakaian</option>
                            <option value="Makanan">Makanan</option>
                            <option value="Otomotif">Otomotif</option>
                            <option value="Hobi">Hobi</option>
                        </select>
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" placeholder="Jelaskan detail produk Anda..." required></textarea>
                    </div>

                    {/* Foto Barang */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Foto Produk</label>
                        <input type="file" onChange={handleFileChange} className="w-full border p-2 rounded bg-gray-50" accept="image/*" required />
                        <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, JPEG. Maks 2MB.</p>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition shadow-lg mt-4">
                        Upload Sekarang
                    </button>
                </form>
            </div>
        </div>
    );
}