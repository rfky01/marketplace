<?php

namespace App\Http\Controllers;

use App\Models\Produk;

class AdminCategoryController extends Controller
{
    public function index()
    {
        $categories = config('product_categories');
        $categoryCounts = Produk::query()
            ->selectRaw('LOWER(kategori) as kategori, COUNT(*) as total')
            ->groupByRaw('LOWER(kategori)')
            ->pluck('total', 'kategori')
            ->map(fn ($total) => (int) $total);
        $totalProducts = $categoryCounts->sum();

        return view('admin.categories', compact('categories', 'categoryCounts', 'totalProducts'));
    }
}
