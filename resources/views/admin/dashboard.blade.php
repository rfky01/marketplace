<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen">

    <nav class="bg-indigo-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </div>
                <h1 class="text-xl font-bold tracking-tight">Admin Panel</h1>
            </div>

            <div class="flex items-center gap-3">

                <a href="{{ route('admin.list') }}" class="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md border border-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin
                </a>

                <a href="{{ route('admin.chats') }}" class="flex items-center gap-2 bg-indigo-800/50 hover:bg-indigo-700 text-indigo-100 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-indigo-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                </a>

                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Keluar
                    </button>
                </form>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8 pb-20">
        
        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 012 2h2a2 2 0 012-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Ringkasan Statistik
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            
            <a href="{{ route('admin.users') }}" class="bg-white p-6 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-blue-200 transition group cursor-pointer relative overflow-hidden">
                <div class="absolute right-2 top-2 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div class="relative z-10">
                    <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <p class="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Pengguna</p>
                    <h3 class="text-3xl font-extrabold text-gray-800 mt-1">{{ $totalUsers }}</h3>
                    <p class="text-xs text-blue-500 font-medium mt-2 flex items-center gap-1">
                        Lihat Detail <span>→</span>
                    </p>
                </div>
            </a>

            <a href="{{ route('admin.products') }}" class="bg-white p-6 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-purple-200 transition group cursor-pointer relative overflow-hidden">
                <div class="absolute right-2 top-2 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                
                <div class="relative z-10">
                    <div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4 text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </div>
                    
                    <p class="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Produk</p>
                    <h3 class="text-3xl font-extrabold text-gray-800 mt-1">{{ $totalProduk ?? 0 }}</h3>
                    <p class="text-xs text-purple-500 font-medium mt-2 flex items-center gap-1">
                        Item Aktif <span>→</span>
                    </p>
                </div>
            </a>

            <a href="{{ route('admin.transactions') }}" class="bg-white p-6 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-green-200 transition group cursor-pointer relative overflow-hidden block">
                <div class="absolute right-2 top-2 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div class="relative z-10">
                    <div class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p class="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Transaksi</p>
                    <h3 class="text-3xl font-extrabold text-gray-800 mt-1">{{ $totalPesanan ?? 0 }}</h3>
                    <p class="text-xs text-green-500 font-medium mt-2 flex items-center gap-1">
                        Lihat Detail <span>→</span>
                    </p>
                </div>
            </a>

            <a href="{{ route('admin.categories.index') }}" class="bg-white p-6 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-orange-200 transition group cursor-pointer relative overflow-hidden">
                <div class="absolute right-2 top-2 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div class="relative z-10">
                    <div class="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-4 text-orange-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <p class="text-gray-500 text-sm font-semibold uppercase tracking-wider">Kategori</p>
                    <h3 class="text-3xl font-extrabold text-gray-800 mt-1">{{ $totalKategori }}</h3>
                    <p class="text-xs text-orange-500 font-medium mt-2 flex items-center gap-1">
                        Kelola Kategori <span>→</span>
                    </p>
                </div>
            </a>

        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div class="p-2 bg-blue-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    Statistik Penjual
                </h4>
                <div class="flex items-center justify-between bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <div>
                        <p class="text-3xl font-extrabold text-blue-700">{{ $totalPenjual }}</p>
                        <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">Akun Toko Aktif</p>
                    </div>
                    <div class="h-12 w-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-4 px-1">User yang telah mengupload minimal 1 produk ke etalase.</p>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div class="p-2 bg-gray-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    Statistik Pembeli
                </h4>
                <div class="flex items-center justify-between bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <div>
                        <p class="text-3xl font-extrabold text-gray-700">{{ $totalPembeli }}</p>
                        <p class="text-xs text-gray-600 font-bold uppercase tracking-wider mt-1">Akun Pembeli</p>
                    </div>
                    <div class="h-12 w-12 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-sm border border-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-4 px-1">User yang terdaftar namun belum membuka toko.</p>
            </div>
        </div>

        <!-- Grafik Akurasi Decision Tree -->
    <div class="mt-6 mb-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-extrabold text-gray-800">
                Grafik Akurasi Model Decision Tree
            </h3>

            <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold">
                TF-IDF + Decision Tree
            </span>
        </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                <div class="lg:col-span-7 grid grid-cols-2 gap-4">
                    <div class="bg-green-50 border border-green-100 rounded-xl p-4">
                        <p class="text-[10px] text-green-600 font-bold uppercase tracking-wider">Accuracy</p>
                        <h4 class="text-2xl font-extrabold text-green-700 mt-1">94,76%</h4>
                    </div>

                    <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p class="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Data Testing</p>
                        <h4 class="text-2xl font-extrabold text-blue-700 mt-1">210</h4>
                    </div>

                    <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <p class="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Prediksi Benar</p>
                        <h4 class="text-2xl font-extrabold text-indigo-700 mt-1">199</h4>
                    </div>

                    <div class="bg-red-50 border border-red-100 rounded-xl p-4">
                        <p class="text-[10px] text-red-600 font-bold uppercase tracking-wider">Prediksi Salah</p>
                        <h4 class="text-2xl font-extrabold text-red-700 mt-1">11</h4>
                    </div>
                </div>

                <div class="lg:col-span-5 flex justify-center">
                    <div class="relative w-56 h-56">
                        <canvas id="accuracyDecisionTreeChart"></canvas>

                        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span class="text-2xl font-extrabold text-gray-800 leading-none">94,76%</span>
                            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                                Akurasi Model
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>

    <script>
        const ctxAccuracy = document.getElementById('accuracyDecisionTreeChart');

        if (ctxAccuracy) {
            new Chart(ctxAccuracy, {
                type: 'doughnut',
                data: {
                    labels: ['Prediksi Benar', 'Prediksi Salah'],
                    datasets: [{
                        data: [94.76, 5.24],
                        backgroundColor: [
                            '#22c55e',
                            '#ef4444'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 4,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.raw + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    </script>

</body>
</html>