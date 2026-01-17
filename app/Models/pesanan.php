<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pesanan extends Model
{
    use HasFactory;

    protected $table = 'pesanan';

    // HANYA BOLEH ADA SATU $fillable
    protected $fillable = [
        'user_id',
        'invoice_code',
        'tanggal',
        'grand_total',
        'status',
        // Data Tambahan (Checkout Lengkap)
        'nama_penerima',
        'email_penerima',
        'telepon_penerima',
        'alamat_pengiriman',
        'catatan',
        'waktu_pengiriman',
        'metode_pembayaran'
    ];

    protected $casts = [
        'tanggal' => 'datetime',
        'waktu_pengiriman' => 'datetime',
    ];

    // Relasi: Pesanan punya banyak Detail Barang
    public function detailPesanan()
    {
        return $this->hasMany(DetailPesanan::class, 'pesanan_id');
    }

    // Relasi: Pesanan milik satu User (Pembeli)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}