<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'npm') && !Schema::hasColumn('users', 'nomor_kk')) {
                $table->renameColumn('npm', 'nomor_kk');
            }

            if (Schema::hasColumn('users', 'fakultas') && !Schema::hasColumn('users', 'nik')) {
                $table->renameColumn('fakultas', 'nik');
            }

            if (Schema::hasColumn('users', 'prodi') && !Schema::hasColumn('users', 'dusun_rt_rw')) {
                $table->renameColumn('prodi', 'dusun_rt_rw');
            }

            if (Schema::hasColumn('users', 'ktm_image') && !Schema::hasColumn('users', 'ktp_image')) {
                $table->renameColumn('ktm_image', 'ktp_image');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'nomor_kk') && !Schema::hasColumn('users', 'npm')) {
                $table->renameColumn('nomor_kk', 'npm');
            }

            if (Schema::hasColumn('users', 'nik') && !Schema::hasColumn('users', 'fakultas')) {
                $table->renameColumn('nik', 'fakultas');
            }

            if (Schema::hasColumn('users', 'dusun_rt_rw') && !Schema::hasColumn('users', 'prodi')) {
                $table->renameColumn('dusun_rt_rw', 'prodi');
            }

            if (Schema::hasColumn('users', 'ktp_image') && !Schema::hasColumn('users', 'ktm_image')) {
                $table->renameColumn('ktp_image', 'ktm_image');
            }
        });
    }
};