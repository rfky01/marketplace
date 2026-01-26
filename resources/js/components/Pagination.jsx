import React from 'react';

export default function Pagination({ currentPage, lastPage, onPageChange }) {
    // Jangan tampilkan jika halaman cuma 1
    if (lastPage <= 1) return null;

    // Logic untuk membuat array angka halaman [1, 2, 3, 4...]
    const pages = [];
    // Batasi tampilan agar tidak terlalu panjang jika halaman ribuan (Opsional, tapi bagus)
    // Untuk sekarang kita tampilkan semua atau bisa dilimit nanti.
    for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
    }

    // Fungsi helper agar tampilan mirip Google (Angka aktif hitam, lainnya biru)
    return (
        <div className="flex items-center justify-center gap-4 mt-10 text-sm font-medium select-none">
            
            {/* TOMBOL SEBELUMNYA (PREVIOUS) */}
            {currentPage > 1 && (
                <button 
                    onClick={() => onPageChange(currentPage - 1)}
                    className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                    <span>&laquo;</span> Sebelumnya
                </button>
            )}

            {/* DERETAN ANGKA HALAMAN */}
            <div className="flex items-center gap-2">
                {pages.map((page) => {
                    // Tampilkan hanya halaman di sekitar halaman aktif (biar tidak kepanjangan)
                    // Logika: Tampilkan halaman 1, halaman terakhir, dan 2 halaman di sekitar current
                    if (
                        page === 1 || 
                        page === lastPage || 
                        (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`px-3 py-1 rounded transition-all ${
                                    page === currentPage
                                        ? 'text-black font-bold cursor-default' // Halaman Aktif
                                        : 'text-blue-700 hover:underline'       // Halaman Lain
                                }`}
                            >
                                {page}
                            </button>
                        );
                    } else if (
                        page === currentPage - 3 || 
                        page === currentPage + 3
                    ) {
                        return <span key={page} className="text-gray-400">...</span>;
                    }
                    return null;
                })}
            </div>

            {/* TOMBOL BERIKUTNYA (NEXT) */}
            {currentPage < lastPage && (
                <button 
                    onClick={() => onPageChange(currentPage + 1)}
                    className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                    Berikutnya <span>&raquo;</span>
                </button>
            )}
            
        </div>
    );
}