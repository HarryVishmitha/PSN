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
        Schema::table('rolls', function (Blueprint $table) {
            //
            $table->decimal('offcut_price', 10, 2)->default(0)->after('price_rate_per_sqft');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rolls', function (Blueprint $table) {
            //
            $table->dropColumn('offcut_price');
        });
    }
};
