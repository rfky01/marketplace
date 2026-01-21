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
        'npm', 
        'prodi',  
        'fakultas',
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
}