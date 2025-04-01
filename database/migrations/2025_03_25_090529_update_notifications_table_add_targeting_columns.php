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
        Schema::table('notifications', function (Blueprint $table) {
            // target_type indicates the intended audience
            // Allowed values: 'all', 'admin', 'working_group', 'user'
            $table->enum('target_type', ['all', 'admin', 'working_group', 'user'])
                  ->default('all')
                  ->after('is_global');

            // target_id stores the ID for a specific working group or user when applicable
            $table->unsignedBigInteger('target_id')
                  ->nullable()
                  ->after('target_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['target_type', 'target_id']);
        });
    }
};
