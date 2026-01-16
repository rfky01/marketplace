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
        Schema::create('pesanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users'); // Pembeli
            $table->string('invoice_code')->unique();
            $table->date('tanggal');
            $table->bigInteger('grand_total');
            $table->enum('status', [
                'pending', 
                'accepted', 
                'dikirim', 
                'selesai', 
                'dibatalkan oleh penjual',
                'dibatalkan oleh pembeli'
                ])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pesanan');
    }
};
