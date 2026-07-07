<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable; 
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',    
        'address',  
        'role',     
        'profile_photo',
        'ktp_image',
        'nomor_kk', 
        'dusun_rt_rw',  
        'nik',
        'bio', 
        'jenis_kelamin', 
        'tanggal_lahir',
        'updated_by',
        ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected static function booted(): void
    {
        // Event 'updating' berjalan TEPAT SEBELUM data disimpan ke database saat proses update.
        static::updating(function ($user) {
            // Cek apakah ada user yang sedang login
            if (Auth::check()) {
                $user->updated_by = Auth::id();
            }
        });
    }
    
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by', 'id');
    }

    public function shop()
    {
        // Asumsi: 1 User hanya punya 1 Toko
        return $this->hasOne(Shop::class); 
    }

    public function products()
    {
        return $this->hasMany(\App\Models\Produk::class, 'user_id'); 
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin' || $this->email === 'admin@marketplace.com';
    }

    public function isAdminUser(): bool
    {
        return $this->isSuperAdmin() || $this->role === 'admin';
    }

    // Tambahkan ini di Model User
    public function isOnline()
    {
        return \Illuminate\Support\Facades\Cache::has('user-is-online-' . $this->id);
    }

    public function getLastSeen()
    {
        $lastSeen = \Illuminate\Support\Facades\Cache::get('user-last-seen-' . $this->id);
        
        if ($lastSeen) {
            // Ubah format waktu menjadi bahasa Indonesia (Contoh: "5 menit yang lalu")
            return \Carbon\Carbon::parse($lastSeen)->locale('id')->diffForHumans();
        }
        
        return 'Belum pernah login';
    }
}
