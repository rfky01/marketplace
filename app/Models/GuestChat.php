<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GuestChat extends Model
{
    use HasFactory;

    // Pastikan nama tabel di database Anda 'guest_chats'
    protected $table = 'guest_chats';

    protected $fillable = [
        'session_id', 
        'admin_id', 
        'sender_type', 
        'message', 
        'is_read'
    ];
}