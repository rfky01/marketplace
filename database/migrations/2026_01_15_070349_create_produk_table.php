<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('produk', function (Blueprint $table) {
            $table->id(); // Ini pengganti produk_id
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('nama_barang');
            $table->bigInteger('harga_barang');
            $table->integer('stok_barang');
            $table->string('foto_barang')->nullable();
            $table->string('kategori');
            $table->text('deskripsi');
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produk');
    }
};
