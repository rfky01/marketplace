<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('guest_chats', function (Blueprint $table) {
            $table->id();
            // Session ID unik sebagai pengganti User ID untuk tamu
            $table->string('session_id')->index(); 
            // ID Admin tujuan (Default 3 sesuai settingan Anda)
            $table->unsignedBigInteger('admin_id')->default(3); 
            // Penanda pengirim: 'guest' atau 'admin'
            $table->string('sender_type'); 
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('guest_chats');
    }
};