<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Manajemen Kategori</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .draggable-item.sortable-ghost { opacity: 0.5; background: #eff6ff; }
        .cursor-move { cursor: grab; }
        .cursor-move:active { cursor: grabbing; }
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
                <h1 class="text-xl font-bold border-l border-indigo-700 pl-4 ml-2 tracking-tight">Manajemen Kategori</h1>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 mt-8 pb-20 max-w-5xl">

        @if(session('success'))
            <div class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r shadow-sm flex justify-between items-center" x-data="{ show: true }" x-show="show">
                <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="font-medium">{{ session('success') }}</p>
                </div>
                <button @click="show = false" class="text-green-700 hover:text-green-900">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        @endif

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            <div class="bg-white p-6 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 md:sticky md:top-24">
                <h3 class="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <div class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    Tambah Baru
                </h3>
                <form action="{{ route('admin.categories.store') }}" method="POST">
                    @csrf
                    <div class="mb-5">
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Kategori</label>
                        <input type="text" name="nama_kategori" placeholder="Contoh: Elektronik" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-gray-700" required>
                    </div>
                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-indigo-200 transition duration-200 flex justify-center items-center gap-2 group">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Simpan Kategori
                    </button>
                </form>
            </div>

            <div class="md:col-span-2">
                <div class="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h3 class="font-bold text-gray-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Daftar Kategori
                        </h3>
                        <span id="save-status" class="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-500 border border-gray-200 transition-all flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                            Geser untuk urutkan
                        </span>
                    </div>

                    <div id="category-list" class="divide-y divide-gray-50">
                        @forelse($categories as $cat)
                            <div class="draggable-item bg-white group hover:bg-gray-50 transition duration-200" data-id="{{ $cat->id }}" x-data="{ editMode: false }">
                                
                                <div x-show="!editMode" class="p-4 flex justify-between items-center">
                                    
                                    <div class="flex items-center gap-4">
                                        <div class="handle cursor-grab text-gray-300 hover:text-indigo-500 p-2 rounded hover:bg-indigo-50 transition active:cursor-grabbing">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                                            </svg>
                                        </div>

                                        <div class="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm border border-indigo-100">
                                            {{ substr($cat->nama_kategori, 0, 1) }}
                                        </div>
                                        <span class="font-semibold text-gray-700 text-base">{{ $cat->nama_kategori }}</span>
                                    </div>
                                    
                                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-200 transform translate-x-2 group-hover:translate-x-0">
                                        <button @click="editMode = true" class="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition" title="Edit">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        
                                        <form action="{{ route('admin.categories.destroy', $cat->id) }}" method="POST" onsubmit="return confirm('Hapus kategori ini?');">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div x-show="editMode" class="p-3 bg-indigo-50/50 border-l-4 border-indigo-500 animate-fade-in" style="display: none;">
                                    <form action="{{ route('admin.categories.update', $cat->id) }}" method="POST" class="flex flex-col md:flex-row gap-2 items-center">
                                        @csrf
                                        @method('PUT')
                                        <div class="flex-1 w-full">
                                            <input type="text" name="nama_kategori" value="{{ $cat->nama_kategori }}" class="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700 bg-white">
                                        </div>
                                        
                                        <div class="flex gap-2 w-full md:w-auto">
                                            <button type="submit" class="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow flex items-center justify-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                                Update
                                            </button>
                                            <button type="button" @click="editMode = false" class="flex-1 md:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                Batal
                                            </button>
                                        </div>
                                    </form>
                                </div>

                            </div>
                        @empty
                            <div class="p-12 text-center">
                                <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p class="text-gray-500 font-medium">Belum ada kategori yang dibuat.</p>
                                <p class="text-gray-400 text-sm">Tambahkan kategori baru di formulir sebelah kiri.</p>
                            </div>
                        @endforelse
                    </div>
                </div>
            </div>

        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            var el = document.getElementById('category-list');
            var statusLabel = document.getElementById('save-status');

            if(el) {
                var sortable = new Sortable(el, {
                    animation: 200,
                    handle: '.handle', 
                    ghostClass: 'sortable-ghost',
                    onEnd: function (evt) {
                        // Status: Menyimpan
                        statusLabel.innerHTML = `<svg class="animate-spin h-3 w-3 mr-1 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Menyimpan...`;
                        statusLabel.className = "text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 transition-all flex items-center";

                        var itemIds = [];
                        document.querySelectorAll('.draggable-item').forEach(function(item) {
                            itemIds.push(item.getAttribute('data-id'));
                        });

                        fetch("{{ route('admin.categories.reorder') }}", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({ ids: itemIds })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if(data.status === 'success') {
                                // Status: Berhasil
                                statusLabel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg> Tersimpan`;
                                statusLabel.className = "text-xs font-semibold px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200 transition-all flex items-center";
                                
                                setTimeout(() => {
                                    statusLabel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg> Geser untuk urutkan`;
                                    statusLabel.className = "text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-500 border border-gray-200 transition-all flex items-center";
                                }, 2000);
                            }
                        });
                    }
                });
            }
        });
    </script>

</body>
</html>