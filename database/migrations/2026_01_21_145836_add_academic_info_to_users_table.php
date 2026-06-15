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
        Schema::table('users', function (Blueprint $table) {
            $table->string('nomor_kk')->nullable()->after('name');     // NPM
            $table->string('dusun_rt_rw')->nullable()->after('nomor_kk');    // Program Studi
            $table->string('nik')->nullable()->after('dusun_rt_rw'); // Fakultas
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nomor_kk', 'dusun_rt_rw', 'nik']);
        });
    }
};
