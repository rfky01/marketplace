import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SellerNavActions({ className = '', showUpload = false }) {
    const [user, setUser] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const readUser = () => {
            try {
                setUser(JSON.parse(localStorage.getItem('user') || 'null'));
            } catch {
                setUser(null);
            }
        };

        readUser();
        window.addEventListener('storage', readUser);
        const interval = setInterval(readUser, 3000);

        return () => {
            window.removeEventListener('storage', readUser);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (user?.role !== 'penjual') {
            setPendingCount(0);
            return;
        }

        const fetchPendingCount = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch('http://127.0.0.1:8000/api/seller/orders/pending-count', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                if (data.success) {
                    setPendingCount(Number(data.pending_count || 0));
                }
            } catch (error) {
                console.error('Gagal mengambil jumlah pesanan pending:', error);
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 10000);

        return () => clearInterval(interval);
    }, [user?.role]);

    if (user?.role !== 'penjual') return null;

    return (
        <div className={`flex items-center gap-1 sm:gap-2 ${className}`}>
            {showUpload && (
                <Link
                    to="/add-product"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-900 px-2 sm:gap-2 sm:px-3 text-[11px] sm:text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-800 decoration-none whitespace-nowrap"
                    title="Upload Produk"
                    aria-label="Upload Produk"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" />
                    </svg>
                    <span>Upload</span>
                </Link>
            )}

            <Link
                to="/seller-orders"
                className="relative inline-flex items-center justify-center p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition decoration-none"
                title="Pesanan Masuk"
                aria-label="Pesanan Masuk"
            >
                <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5h6m-6 4h6m-6 4h4m-7 8h12a2 2 0 002-2V7.5a2 2 0 00-.6-1.4l-3.5-3.5A2 2 0 0014.5 2H6a2 2 0 00-2 2v15a2 2 0 002 2z" />
                    </svg>
                </span>
                {pendingCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full border-2 border-white">
                        {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                )}
            </Link>
        </div>
    );
}
