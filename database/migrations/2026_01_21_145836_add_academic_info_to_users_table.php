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
            $table->string('npm')->nullable()->after('name');     // NPM
            $table->string('prodi')->nullable()->after('npm');    // Program Studi
            $table->string('fakultas')->nullable()->after('prodi'); // Fakultas
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['npm', 'prodi', 'fakultas']);
        });
    }
};
