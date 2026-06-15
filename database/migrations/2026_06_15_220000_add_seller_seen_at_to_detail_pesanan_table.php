<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detail_pesanan', function (Blueprint $table) {
            $table->timestamp('seller_seen_at')->nullable();
        });

        DB::table('detail_pesanan')
            ->whereNull('seller_seen_at')
            ->update(['seller_seen_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('detail_pesanan', function (Blueprint $table) {
            $table->dropColumn('seller_seen_at');
        });
    }
};
