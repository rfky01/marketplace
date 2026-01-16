<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\produk;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Total Uang Masuk
        $total_omzet = Order::sum('total_price');

        // 2. Total Kali Transaksi
        $total_transaksi = Order::count();

        // 3. Total Pcs Barang (KITA MATIKAN DULU KARENA KOLOM TIDAK ADA)
        // Kita ganti jadi 0 dulu atau hapus baris ini
        $total_barang_terjual = 0; // Order::sum('quantity'); <--- Ini yang bikin error

        // 4. Data 5 Transaksi Terakhir
        $pesanan_terbaru = Order::with('buyer') 
                                ->latest()
                                ->take(5)
                                ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data Dashboard Toko Siap!',
            'data' => [
                'statistik' => [
                    'omzet_bersih' => "Rp " . number_format($total_omzet, 0, ',', '.'),
                    'total_transaksi' => $total_transaksi . " Transaksi",
                    // 'total_barang_laku' => $total_barang_terjual . " Pcs" // Hapus atau sembunyikan dulu
                ],
                'riwayat_order_terbaru' => $pesanan_terbaru
            ]
        ]);
    }
}