<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kategori Otomatis</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="min-h-screen bg-gray-50 text-gray-900">
    @php
        $categoryCounts = collect($categoryCounts ?? []);
    @endphp

    <nav class="bg-indigo-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div class="container mx-auto flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-indigo-200">Admin Panel</p>
                    <h1 class="text-lg font-extrabold tracking-tight">Kategori Otomatis</h1>
                </div>
            </div>

            <a href="{{ route('admin.dashboard') }}" class="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
            </a>
        </div>
    </nav>

    <main class="container mx-auto px-4 py-8">
        <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <h2 class="text-2xl font-extrabold text-gray-800">Kategori Produk</h2>
                <p class="mt-1 text-sm font-medium text-gray-500">Hasil klasifikasi dari model Decision Tree.</p>
            </div>

            <div class="flex flex-wrap gap-2">
                <span class="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-indigo-700">Decision Tree</span>
                <span class="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700">{{ count($categories ?? []) }} Aktif</span>
                <span class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-700">{{ number_format($totalProducts ?? 0) }} Produk</span>
            </div>
        </div>

        <section class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <a href="{{ route('admin.products', ['category' => 'makanan', 'from' => 'categories']) }}" class="group rounded-lg border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2">
                <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition group-hover:bg-orange-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 5a6 6 0 016 6v2H6v-2a6 6 0 016-6z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 17h16M12 3v2" />
                    </svg>
                </div>
                <p class="text-xs font-bold uppercase tracking-wider text-orange-500">Kategori 01</p>
                <h3 class="mt-2 text-xl font-extrabold text-gray-800">Makanan</h3>
                <div class="mt-5 border-t border-gray-100 pt-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Produk Terupload</p>
                    <p class="mt-1 text-3xl font-extrabold text-gray-900">{{ number_format($categoryCounts->get('makanan', 0)) }}</p>
                </div>
            </a>

            <a href="{{ route('admin.products', ['category' => 'kerajinan', 'from' => 'categories']) }}" class="group rounded-lg border border-violet-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2">
                <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition group-hover:bg-violet-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 12L4 7.5M12 12l8-4.5M12 12v9" />
                    </svg>
                </div>
                <p class="text-xs font-bold uppercase tracking-wider text-violet-500">Kategori 02</p>
                <h3 class="mt-2 text-xl font-extrabold text-gray-800">Kerajinan</h3>
                <div class="mt-5 border-t border-gray-100 pt-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Produk Terupload</p>
                    <p class="mt-1 text-3xl font-extrabold text-gray-900">{{ number_format($categoryCounts->get('kerajinan', 0)) }}</p>
                </div>
            </a>

            <a href="{{ route('admin.products', ['category' => 'pertanian', 'from' => 'categories']) }}" class="group rounded-lg border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2">
                <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 21V11" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 11c0-4 3-7 7-7 0 4-3 7-7 7zM12 13c0-4-3-7-7-7 0 4 3 7 7 7z" />
                    </svg>
                </div>
                <p class="text-xs font-bold uppercase tracking-wider text-emerald-500">Kategori 03</p>
                <h3 class="mt-2 text-xl font-extrabold text-gray-800">Pertanian</h3>
                <div class="mt-5 border-t border-gray-100 pt-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Produk Terupload</p>
                    <p class="mt-1 text-3xl font-extrabold text-gray-900">{{ number_format($categoryCounts->get('pertanian', 0)) }}</p>
                </div>
            </a>

            <a href="{{ route('admin.products', ['category' => 'perikanan', 'from' => 'categories']) }}" class="group rounded-lg border border-cyan-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2">
                <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100 transition group-hover:bg-cyan-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12s4-6 10-6c4 0 7 3 8 6-1 3-4 6-8 6-6 0-10-6-10-6z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 12l2-3v6l-2-3z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 11h.01" />
                    </svg>
                </div>
                <p class="text-xs font-bold uppercase tracking-wider text-cyan-500">Kategori 04</p>
                <h3 class="mt-2 text-xl font-extrabold text-gray-800">Perikanan</h3>
                <div class="mt-5 border-t border-gray-100 pt-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">Produk Terupload</p>
                    <p class="mt-1 text-3xl font-extrabold text-gray-900">{{ number_format($categoryCounts->get('perikanan', 0)) }}</p>
                </div>
            </a>
        </section>
    </main>
</body>
</html>
