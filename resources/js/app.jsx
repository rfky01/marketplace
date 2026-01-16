import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Import komponen halaman (Nanti kita buat)
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';

function App() {
    return (
        <BrowserRouter>
            <div className="container mx-auto p-4">
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
                </Routes>
            </div>
        </BrowserRouter>
    );
}

// Render React ke div id="app" yang ada di blade tadi
if(document.getElementById('app')){
    ReactDOM.createRoot(document.getElementById('app')).render(<App />);
}