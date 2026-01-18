import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Import komponen halaman (Nanti kita buat)
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import AddProduct from './components/AddProduct';
import MyProducts from './components/MyProducts';
import EditProduct from './components/EditProduct';
import ProductDetail from './components/ProductDetail';
import Keranjang from './components/Keranjang';

function App() {
    return (
        <BrowserRouter>
            <div className="w-full">
                {/* Tempat Ganti Halaman */}
                <Routes>
                    {/* Route Utama diarahkan ke Dashboard */}
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/add-product" element={<AddProduct />} />
                    <Route path="/my-products" element={<MyProducts />} />
                    <Route path="/edit-product/:id" element={<EditProduct />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/Keranjang" element={<Keranjang />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

// Render React ke div id="app" yang ada di blade tadi
if(document.getElementById('app')){
    ReactDOM.createRoot(document.getElementById('app')).render(<App />);
}