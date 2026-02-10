<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\DetailPesanan;

class Pesanan extends Model
{
    use HasFactory;

    protected $table = 'pesanan';

    protected $fillable = [
        'user_id',
        'invoice_code',
        'tanggal',
        'grand_total',
        'status',
        'nama_penerima',
        'email_penerima',
        'telepon_penerima',
        'alamat_pengiriman',
        'catatan',
        'waktu_pengiriman',
        'metode_pembayaran',
        'hidden_for_buyer',  
        'hidden_for_seller'
    ];

    protected $casts = [
        'tanggal' => 'datetime',
        'waktu_pengiriman' => 'datetime',
        'hidden_for_buyer' => 'boolean',
        'hidden_for_seller' => 'boolean',
    ];

    // Relasi: Pesanan punya banyak Detail Barang
    public function detailPesanan()
    {
        return $this->hasMany(DetailPesanan::class, 'pesanan_id');
    }
    
    public function detail_pesanan()
    {
        // Fungsi ini memberitahu Laravel bahwa 1 Pesanan punya banyak DetailPesanan
        return $this->hasMany(DetailPesanan::class, 'pesanan_id');
    }

    // Relasi: Pesanan milik satu User (Pembeli)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}