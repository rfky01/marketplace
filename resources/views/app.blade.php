<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Marketplace API</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="bg-gray-100 font-sans" x-data="app()">

    <nav class="bg-blue-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold">🛒 Demo Marketplace</h1>
            <div>
                <template x-if="token">
                    <button @click="logout" class="bg-red-500 hover:bg-red-700 px-4 py-2 rounded text-sm">Logout</button>
                </template>
            </div>
        </div>
    </nav>

    <div class="container mx-auto p-6">

        <div x-show="!token" class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            
            <div class="flex border-b mb-4">
                <button @click="mode = 'login'" :class="mode === 'login' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'" class="w-1/2 py-2 text-center font-semibold">Login</button>
                <button @click="mode = 'register'" :class="mode === 'register' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'" class="w-1/2 py-2 text-center font-semibold">Register</button>
            </div>

            <div x-show="mode === 'login'">
                <input type="email" x-model="form.email" placeholder="Email" class="w-full border p-2 rounded mb-3">
                <input type="password" x-model="form.password" placeholder="Password" class="w-full border p-2 rounded mb-4">
                <button @click="login" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Masuk</button>
            </div>

            <div x-show="mode === 'register'">
                <input type="text" x-model="form.name" placeholder="Nama Lengkap" class="w-full border p-2 rounded mb-3">
                <input type="email" x-model="form.email" placeholder="Email" class="w-full border p-2 rounded mb-3">
                <input type="password" x-model="form.password" placeholder="Password" class="w-full border p-2 rounded mb-3">
                <input type="password" x-model="form.password_confirmation" placeholder="Konfirmasi Password" class="w-full border p-2 rounded mb-3">
                <select x-model="form.role" class="w-full border p-2 rounded mb-4">
                    <option value="pembeli">Pembeli</option>
                    <option value="penjual">Penjual</option>
                </select>
                <button @click="register" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Daftar</button>
            </div>
        </div>

        <div x-show="token" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div class="col-span-3 bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">📊 Dashboard Toko</h2>
                <div class="grid grid-cols-3 gap-4 text-center" x-data="{ stats: { omzet_bersih: '...', total_transaksi: '...', total_barang_laku: '...' } }" x-init="fetchDashboard($data)">
                    <div class="p-4 bg-blue-50 rounded border border-blue-200">
                        <p class="text-sm text-gray-500">Total Omzet</p>
                        <p class="text-xl font-bold text-blue-700" x-text="stats.omzet_bersih">Rp 0</p>
                    </div>
                    <div class="p-4 bg-green-50 rounded border border-green-200">
                        <p class="text-sm text-gray-500">Total Transaksi</p>
                        <p class="text-xl font-bold text-green-700" x-text="stats.total_transaksi">0</p>
                    </div>
                    <div class="p-4 bg-purple-50 rounded border border-purple-200">
                        <p class="text-sm text-gray-500">Barang Terjual</p>
                        <p class="text-xl font-bold text-purple-700" x-text="stats.total_barang_laku">0</p>
                    </div>
                </div>
            </div>

            <div class="col-span-3">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">📦 Daftar Barang di Database</h2>
                    <button @click="getProducts" class="text-sm text-blue-600 underline">Refresh Data</button>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <template x-for="item in products" :key="item.id">
                        <div class="bg-white rounded shadow overflow-hidden group">
                            <div class="h-40 bg-gray-200 w-full overflow-hidden">
                                <template x-if="item.image">
                                    <img :src="item.image" class="w-full h-full object-cover group-hover:scale-110 transition">
                                </template>
                                <template x-if="!item.image">
                                    <div class="flex items-center justify-center h-full text-gray-400">No Image</div>
                                </template>
                            </div>
                            <div class="p-4">
                                <h3 class="font-bold truncate" x-text="item.name"></h3>
                                <p class="text-green-600 font-bold" x-text="'Rp ' + item.price.toLocaleString()"></p>
                                <p class="text-xs text-gray-500 mt-1" x-text="item.category"></p>
                                <p class="text-xs text-gray-400 mt-2 truncate" x-text="item.description || 'Tidak ada deskripsi'"></p>
                            </div>
                        </div>
                    </template>
                </div>
                <div x-show="products.length === 0" class="text-center text-gray-500 py-10">
                    Belum ada barang. Silakan posting lewat Postman dulu.
                </div>
            </div>

        </div>

    </div>

    <script>
        function app() {
            return {
                mode: 'login',
                token: localStorage.getItem('api_token') || null,
                form: { name: '', email: '', password: '', password_confirmation: '', role: 'pembeli' },
                products: [],
                
                async login() {
                    try {
                        let res = await fetch('/api/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify({ email: this.form.email, password: this.form.password })
                        });
                        let data = await res.json();
                        if (res.ok) {
                            this.token = data.access_token;
                            localStorage.setItem('api_token', this.token);
                            this.getProducts();
                            location.reload(); // Refresh biar dashboard update
                        } else {
                            alert('Login Gagal: ' + data.message);
                        }
                    } catch (e) { alert('Error: ' + e); }
                },

                async register() {
                    try {
                        let res = await fetch('/api/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify(this.form)
                        });
                        let data = await res.json();
                        if (res.ok) {
                            alert('Register Berhasil! Silakan Login.');
                            this.mode = 'login';
                        } else {
                            alert('Gagal: ' + JSON.stringify(data.errors || data.message));
                        }
                    } catch (e) { alert('Error: ' + e); }
                },

                logout() {
                    fetch('/api/logout', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + this.token, 'Accept': 'application/json' }
                    });
                    this.token = null;
                    localStorage.removeItem('api_token');
                    this.products = [];
                },

                async getProducts() {
                    if (!this.token) return;
                    let res = await fetch('/api/products', {
                        headers: { 'Accept': 'application/json' }
                    });
                    let data = await res.json();
                    if (data.success) {
                        this.products = data.data;
                    }
                },

                async fetchDashboard(scope) {
                    if (!this.token) return;
                    let res = await fetch('/api/dashboard', {
                        headers: { 'Authorization': 'Bearer ' + this.token, 'Accept': 'application/json' }
                    });
                    let data = await res.json();
                    if (data.success) {
                        scope.stats = data.data.statistik;
                    }
                },

                init() {
                    if (this.token) {
                        this.getProducts();
                    }
                }
            }
        }
    </script>
</body>
</html>