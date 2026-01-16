<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    use HasFactory;

    protected $table = 'pesanan';

    protected $fillable = [
        'user_id',
        'invoice_code',
        'tanggal',
        'grand_total',
        'status'
    ];

    // Relasi: Pesanan punya banyak Detail Barang
    public function detail()
    {
        return $this->hasMany(DetailPesanan::class, 'pesanan_id');
    }

    // Relasi: Pesanan milik satu User (Pembeli)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detailPesanan()
    {
        // Pastikan nama model DetailPesanan benar (sesuai nama file Anda)
        return $this->hasMany(DetailPesanan::class, 'pesanan_id', 'id');
    }
}