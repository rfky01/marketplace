<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->string('nama_penerima')->nullable();
            $table->string('email_penerima')->nullable();
            $table->string('telepon_penerima')->nullable();
            $table->text('alamat_pengiriman')->nullable();
            $table->text('catatan')->nullable(); // Deskripsi tempat
            $table->dateTime('waktu_pengiriman')->nullable(); // Tanggal & Jam
            $table->string('metode_pembayaran')->default('cod'); // COD, QRIS, dll
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn([
                'nama_penerima', 
                'email_penerima', 
                'telepon_penerima',
                'alamat_pengiriman', 
                'catatan', 
                'waktu_pengiriman', 
                'metode_pembayaran'
            ]);
        });
    }
};