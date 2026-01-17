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
import Cart from './components/Cart';

function App() {
    return (
        <BrowserRouter>
            <div className="w-full">
                {/* Navbar Sederhana */}
                <nav className="mb-4 flex justify-between bg-white p-4 shadow rounded">
                    <Link to="/" className="font-bold text-lg text-blue-600">Marketplace</Link>
                    <div>
                        <Link to="/login" className="mr-4 text-gray-600 hover:text-blue-500">Login</Link>
                        <Link to="/register" className="text-gray-600 hover:text-blue-500">Register</Link>
                    </div>
                </nav>

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
                    <Route path="/cart" element={<Cart />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

// Render React ke div id="app" yang ada di blade tadi
if(document.getElementById('app')){
    ReactDOM.createRoot(document.getElementById('app')).render(<App />);
}