<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class produk extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'produk'; // Definisikan nama tabel karena tidak pakai bahasa Inggris (plural)

    protected $fillable = [
        'user_id',
        'nama_barang',
        'harga_barang',
        'stok_barang',
        'foto_barang',
        'kategori',
        'deskripsi',
        'updated_by'
    ];

    // Relasi: produk milik satu User (Penjual)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function ulasan()
{
    return $this->hasMany(Riview::class);
}
}