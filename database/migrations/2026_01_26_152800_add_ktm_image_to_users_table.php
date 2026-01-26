<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Menambahkan kolom ktm_image setelah profile_photo
            if (!Schema::hasColumn('users', 'ktm_image')) {
                $table->string('ktm_image')->nullable()->after('profile_photo');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'ktm_image')) {
                $table->dropColumn('ktm_image');
            }
        });
    }
};