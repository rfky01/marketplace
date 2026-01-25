import React, { useState, useEffect } from 'react';

export default function ProductImageSlider({ images, alt }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);

    // 1. Normalisasi data gambar (jaga-jaga kalau datanya string atau array)
    const imageList = Array.isArray(images) 
        ? images 
        : (typeof images === 'string' && images.trim() !== '' ? [images] : []);

    // 2. Logika Slide Otomatis saat disentuh/di-hover
    useEffect(() => {
        let interval;
        if (isActive && imageList.length > 1) {
            // Ganti gambar setiap 1 detik (1000ms)
            interval = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % imageList.length);
            }, 1000); 
        } else {
            // Reset ke gambar pertama saat mouse pergi
            setCurrentIndex(0);
        }

        return () => clearInterval(interval);
    }, [isActive, imageList.length]);

    // 3. Helper URL Gambar
    const getImageUrl = (path) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith('http')) return path;
        return `http://127.0.0.1:8000/storage/${path}`;
    };

    // Jika tidak ada gambar
    if (imageList.length === 0) {
        return (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                No Image
            </div>
        );
    }

    return (
        <div 
            className="relative w-full h-48 bg-white overflow-hidden group cursor-pointer"
            // Trigger untuk Desktop (Mouse)
            onMouseEnter={() => setIsActive(true)}
            onMouseLeave={() => setIsActive(false)}
            // Trigger untuk HP (Sentuh)
            onTouchStart={() => setIsActive(true)}
            onTouchEnd={() => setIsActive(false)}
        >
            <img 
                src={getImageUrl(imageList[currentIndex])} 
                alt={alt} 
                className="w-full h-full object-contain transition-all duration-300"
            />

            {/* Indikator Titik (Opsional - Muncul saat slide aktif) */}
            {isActive && imageList.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                    {imageList.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${
                                idx === currentIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}