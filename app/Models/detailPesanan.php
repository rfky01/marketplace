<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailPesanan extends Model
{
    use HasFactory;

    protected $table = 'detail_pesanan';

    protected $fillable = [
        'pesanan_id',
        'produk_id',
        'jumlah',
        'total_harga',
        'seller_seen_at'
    ];

    protected $casts = [
        'seller_seen_at' => 'datetime',
    ];

    // Relasi ke Produk
    public function produk()
    {
        return $this->belongsTo(produk::class, 'produk_id');
    }

    // Relasi ke Pesanan Induk
    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class, 'pesanan_id');
    }
}
