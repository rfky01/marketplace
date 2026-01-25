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
        Schema::table('pesanan', function (Blueprint $table) {
            // Kolom penanda: true jika user sudah menghapus riwayatnya
            $table->boolean('hidden_for_buyer')->default(false)->after('status'); 
            $table->boolean('hidden_for_seller')->default(false)->after('hidden_for_buyer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn(['hidden_for_buyer', 'hidden_for_seller']);
        });
    }
};