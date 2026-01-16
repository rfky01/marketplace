<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class produk extends Model
{
    use HasFactory;

    protected $table = 'produk'; // Definisikan nama tabel karena tidak pakai bahasa Inggris (plural)

    protected $fillable = [
        'user_id',
        'nama_barang',
        'harga_barang',
        'stok_barang',
        'foto_barang',
        'kategori',
        'deskripsi'
    ];

    // Relasi: produk milik satu User (Penjual)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}