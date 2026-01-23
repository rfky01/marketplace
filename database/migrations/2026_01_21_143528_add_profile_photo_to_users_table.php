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
        // PERBAIKAN: Gunakan Schema::table (untuk edit), BUKAN Schema::create
        Schema::table('users', function (Blueprint $table) {
            // Cek dulu biar aman, kalau kolom belum ada baru dibuat
            if (!Schema::hasColumn('users', 'profile_photo')) {
                $table->string('profile_photo')->nullable()->after('email');
                $table->text('bio')->nullable()->after('email');
                $table->string('jenis_kelamin')->nullable()->after('bio');
                $table->date('tanggal_lahir')->nullable()->after('jenis_kelamin');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'profile_photo')) {
                $table->dropColumn('profile_photo');
            }
        });
    }
};