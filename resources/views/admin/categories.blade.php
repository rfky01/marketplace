<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kategori Otomatis - Decision Tree</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">

    <nav class="bg-indigo-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition text-sm font-semibold border border-transparent hover:border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Dashboard
                </a>
                <h1 class="text-xl font-bold border-l border-indigo-700 pl-4 ml-2 tracking-tight">
                    Kategori Otomatis
                </h1>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8 pb-20 max-w-6xl">

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h2 class="text-2xl font-extrabold text-gray-800 mb-2">
                        Kategori Produk Berdasarkan Decision Tree
                    </h2>
                    <p class="text-gray-600 leading-relaxed max-w-3xl">
                        Halaman ini menampilkan kategori final yang digunakan pada sistem marketplace UMKM desa.
                        Kategori produk tidak dipilih secara manual oleh penjual maupun admin, tetapi ditentukan
                        otomatis berdasarkan nama produk dan deskripsi produk menggunakan algoritma
                        <b>Decision Tree</b> dengan pembobotan teks <b>TF-IDF</b>.
                    </p>
                </div>

                <div class="bg-indigo-50 text-indigo-700 px-5 py-4 rounded-xl border border-indigo-100">
                    <p class="text-xs font-bold uppercase tracking-wider">Metode Klasifikasi</p>
                    <p class="text-lg font-extrabold">TF-IDF + Decision Tree</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                    🍽️
                </div>
                <h3 class="text-lg font-extrabold text-gray-800 uppercase">Makanan</h3>
                <p class="text-sm text-gray-500 mt-2">
                    Digunakan untuk produk siap konsumsi, olahan makanan, camilan, minuman, dan hasil olahan pangan UMKM.
                </p>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                    🧺
                </div>
                <h3 class="text-lg font-extrabold text-gray-800 uppercase">Kerajinan</h3>
                <p class="text-sm text-gray-500 mt-2">
                    Digunakan untuk produk hasil keterampilan tangan seperti anyaman, bambu, rotan, kayu, dan produk seni lokal.
                </p>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                    🌱
                </div>
                <h3 class="text-lg font-extrabold text-gray-800 uppercase">Pertanian</h3>
                <p class="text-sm text-gray-500 mt-2">
                    Digunakan untuk bibit tanaman, benih, hasil pertanian, pupuk, tanaman, dan kebutuhan pertanian warga desa.
                </p>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    🐟
                </div>
                <h3 class="text-lg font-extrabold text-gray-800 uppercase">Perikanan</h3>
                <p class="text-sm text-gray-500 mt-2">
                    Digunakan untuk produk ikan konsumsi, bibit ikan, pakan ikan, hasil budidaya, dan kebutuhan perikanan.
                </p>
            </div>

        </div>

        <div class="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h3 class="font-extrabold text-blue-800 mb-2">
                Catatan Sistem
            </h3>
            <p class="text-sm text-blue-700 leading-relaxed">
                Admin tidak perlu menambah, mengubah, atau menghapus kategori secara manual. Kategori produk
                ditentukan otomatis ketika penjual menambahkan atau mengedit produk. Sistem akan mengirimkan
                nama produk dan deskripsi produk ke Python API, kemudian model Decision Tree mengembalikan
                kategori hasil klasifikasi untuk disimpan ke database.
            </p>
        </div>

    </div>

</body>
</html>