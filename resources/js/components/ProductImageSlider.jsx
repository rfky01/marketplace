import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductImageSlider({ images, alt, detailUrl }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const hoverTimerRef = useRef(null);
    const navigate = useNavigate();

    // 1. Normalisasi data gambar (jaga-jaga kalau datanya string atau array)
    const imageList = Array.isArray(images) 
        ? images 
        : (typeof images === 'string' && images.trim() !== '' ? [images] : []);

    // 2. Helper URL Gambar
    const getImageUrl = (path) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith('http')) return path;
        return `http://127.0.0.1:8000/storage/${path}`;
    };

    const goToImage = (index, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        setCurrentIndex(index);
    };

    const goToNext = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (imageList.length <= 1) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % imageList.length);
    };

    const goToPrev = (event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (imageList.length <= 1) return;
        setCurrentIndex((prevIndex) => (prevIndex - 1 + imageList.length) % imageList.length);
    };

    const canUseDesktopHover = () => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
        return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    };

    const stopHoverSlide = () => {
        if (hoverTimerRef.current) {
            window.clearInterval(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    };

    const startHoverSlide = () => {
        if (imageList.length <= 1 || !canUseDesktopHover() || hoverTimerRef.current) return;

        hoverTimerRef.current = window.setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % imageList.length);
        }, 1100);
    };

    useEffect(() => {
        stopHoverSlide();
        setCurrentIndex(0);

        return stopHoverSlide;
    }, [imageList.length]);

    const openDetail = () => {
        if (detailUrl) {
            navigate(detailUrl);
        }
    };

    const handleImageClick = (event) => {
        if (imageList.length <= 1) {
            openDetail();
            return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        const xPosition = event.clientX - bounds.left;
        const ratio = xPosition / bounds.width;

        if (ratio < 0.35) {
            goToPrev(event);
            return;
        }

        if (ratio > 0.65) {
            goToNext(event);
            return;
        }

        openDetail();
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
            onClick={handleImageClick}
            onMouseEnter={startHoverSlide}
            onMouseLeave={stopHoverSlide}
        >
            <img 
                src={getImageUrl(imageList[currentIndex])} 
                alt={alt} 
                className="w-full h-full object-contain transition-all duration-300"
            />

            {imageList.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
                    {imageList.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={(event) => goToImage(idx, event)}
                            className={`h-2 w-2 rounded-full shadow-sm transition-all ${
                                idx === currentIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                            }`}
                            aria-label={`Lihat foto ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
