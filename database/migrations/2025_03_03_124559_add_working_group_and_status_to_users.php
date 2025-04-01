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
            // Adding the 'working_group_id' column as a foreign key (nullable)
            $table->unsignedBigInteger('working_group_id')->nullable()->after('role_id');

            // Adding the 'status' column with predefined options
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('role_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Dropping the columns in case of rollback
            $table->dropColumn(['working_group_id', 'status']);
        });
    }
};
