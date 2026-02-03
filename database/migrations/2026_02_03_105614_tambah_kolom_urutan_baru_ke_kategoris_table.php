<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('kategoris', function (Blueprint $table) {
            // Kita cek dulu, jika kolom belum ada, baru buat
            if (!Schema::hasColumn('kategoris', 'urutan')) {
                $table->integer('urutan')->default(0);
            }
        });
    }

    public function down()
    {
        Schema::table('kategoris', function (Blueprint $table) {
            if (Schema::hasColumn('kategoris', 'urutan')) {
                $table->dropColumn('urutan');
            }
        });
    }
};