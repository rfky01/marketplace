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
        const file = e.target.files[0];
        setImage(file);
        // Buat preview gambar baru
        if(file) setPreviewImage(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Foto Produk</label>
                        {/* Preview Gambar Lama/Baru */}
                        {previewImage && (
                            <img src={previewImage} alt="Preview" className="w-32 h-32 object-cover rounded mb-2 border" />
                        )}
                        <input type="file" onChange={handleFileChange} className="w-full border p-2 rounded bg-gray-50" accept="image/*" />
                    </div>

                    <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded transition shadow-lg mt-4">
                        Simpan Perubahan
                    </button>
                </form>
            </div>
        </div>
    );
}