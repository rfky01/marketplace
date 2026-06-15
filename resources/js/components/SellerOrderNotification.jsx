import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SellerOrderNotification() {
    const navigate = useNavigate();
    const [notification, setNotification] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const lastSignatureRef = useRef('');

    const getStoredUser = () => {
        try {
            return JSON.parse(localStorage.getItem('user') || 'null');
        } catch {
            return null;
        }
    };

    const canCheckNotifications = () => {
        const token = localStorage.getItem('token');
        const user = getStoredUser();

        return Boolean(token && user?.role === 'penjual');
    };

    const fetchNotifications = async () => {
        if (!canCheckNotifications()) {
            setIsVisible(false);
            return;
        }

        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://127.0.0.1:8000/api/seller/order-notifications', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            if (!response.ok) return;

            const data = await response.json();
            const items = data.data || [];
            const signature = items.map((item) => item.id).join(',');

            if (data.success && data.unread_count > 0 && signature !== lastSignatureRef.current) {
                lastSignatureRef.current = signature;
                setNotification(data);
                setIsVisible(true);
            }

            if (data.success && data.unread_count === 0) {
                setIsVisible(false);
                setNotification(null);
                lastSignatureRef.current = '';
            }
        } catch (error) {
            console.error('Gagal mengambil notifikasi pesanan:', error);
        }
    };

    const markAsRead = async () => {
        if (!canCheckNotifications()) return;

        const token = localStorage.getItem('token');

        try {
            await fetch('http://127.0.0.1:8000/api/seller/order-notifications/read', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
        } catch (error) {
            console.error('Gagal menandai notifikasi pesanan:', error);
        }
    };

    const handleOpenOrders = async () => {
        await markAsRead();
        setIsVisible(false);
        navigate('/seller-orders');
    };

    const handleDismiss = async () => {
        await markAsRead();
        setIsVisible(false);
        setNotification(null);
        lastSignatureRef.current = '';
    };

    useEffect(() => {
        const timer = setTimeout(fetchNotifications, 1500);
        const interval = setInterval(fetchNotifications, 10000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 6000);

        return () => clearTimeout(timer);
    }, [isVisible, notification]);

    if (!isVisible || !notification?.unread_count) return null;

    const firstItem = notification.data?.[0] || {};
    const extraCount = Math.max((notification.unread_count || 0) - 1, 0);

    return (
        <div className="fixed left-1/2 top-[86px] z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2.5 shadow-xl">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0" />
                    </svg>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-gray-900">Pesanan baru masuk</p>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            {notification.unread_count}
                        </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">{firstItem.product_name || 'Produk baru'}</span>
                        {firstItem.buyer_name ? ` dari ${firstItem.buyer_name}` : ''}
                        {extraCount > 0 ? ` +${extraCount} lainnya` : ''}
                    </p>
                </div>

                <button onClick={handleOpenOrders} className="hidden rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex">
                    Lihat
                </button>

                <button onClick={handleDismiss} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Tutup notifikasi">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <button onClick={handleOpenOrders} className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 sm:hidden">
                Lihat Pesanan
            </button>
        </div>
    );
}
