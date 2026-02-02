<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Auth;

class User extends Authenticatable
{
    // <--- 2. TAMBAHKAN 'HasApiTokens' DI DALAM SINI
    use HasApiTokens, HasFactory, Notifiable; 

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',    // Jika tadi Anda menambahkan phone
        'address',  // Jika tadi Anda menambahkan address
        'role',     // Pastikan role juga ada di sini
        'profile_photo',
        'ktm_image',
        'npm', 
        'prodi',  
        'fakultas',
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
                // Isi kolom 'updated_by' dengan ID user yang sedang login saat ini
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
        // Pastikan Anda sudah punya model Shop
        return $this->hasOne(Shop::class); 
    }

    // app/Models/User.php

    // ... code lain ...

    // Tambahkan fungsi relasi ini:
    public function products()
    {
        // Asumsi tabel produk Anda bernama 'produk' (sesuai screenshot database)
        // dan foreign key di tabel produk adalah 'users_id' atau 'user_id'
        // Cek migration create_produk_table untuk memastikan nama kolomnya.
        // Jika kolomnya 'users_id', kodenya:
        return $this->hasMany(\App\Models\Produk::class, 'user_id'); 
    }
}