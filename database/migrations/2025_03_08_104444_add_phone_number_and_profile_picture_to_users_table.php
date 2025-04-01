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
            $table->string('phone_number')->nullable(); // Phone number column
            $table->string('profile_picture')->nullable(); // Profile picture column (store the path to the image)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone_number')->nullable(); // Phone number column
            $table->string('profile_picture')->nullable(); // Profile picture column (store the path to the image)
        });
    }
};
