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
        Schema::table('working_groups', function (Blueprint $table) {
            $table->string('wg_image')->nullable();
            $table->enum('status', ['active', 'inactive', 'inactivating'])->default('active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('working_groups', function (Blueprint $table) {
            $table->dropColumn(['wg_image', 'status']);
        });
    }
};
