<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class produk extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'produk';

    protected $fillable = [
        'user_id',
        'nama_barang',
        'slug',
        'harga_barang',
        'stok_barang',
        'foto_barang',
        'kategori',
        'deskripsi',
        'updated_by'
    ];

    protected $appends = [
        'is_super_admin_override',
        'override_admin_name',
        'override_reason',
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

    public function overrideCreationLog()
    {
        return $this->hasOne(AdminOverrideLog::class, 'subject_id')
            ->where('action', 'create_product_for_seller')
            ->whereIn('subject_type', ['App\\Models\\Produk', 'App\\Models\\produk'])
            ->latestOfMany();
    }

    public function ulasan()
    {
        return $this->hasMany(Riview::class);
    }

    public function getIsSuperAdminOverrideAttribute(): bool
    {
        if ($this->relationLoaded('overrideCreationLog') && $this->overrideCreationLog) {
            return true;
        }

        if ($this->relationLoaded('updater') && $this->updater?->isSuperAdmin()) {
            return true;
        }

        return false;
    }

    public function getOverrideAdminNameAttribute(): ?string
    {
        if ($this->relationLoaded('overrideCreationLog') && $this->overrideCreationLog?->actor) {
            return $this->overrideCreationLog->actor->name;
        }

        if ($this->relationLoaded('updater') && $this->updater?->isSuperAdmin()) {
            return $this->updater->name;
        }

        return null;
    }

    public function getOverrideReasonAttribute(): ?string
    {
        if ($this->relationLoaded('overrideCreationLog') && $this->overrideCreationLog) {
            return $this->overrideCreationLog->reason;
        }

        return null;
    }

    protected $casts = [
    'foto_barang' => 'array',
    ];
}
