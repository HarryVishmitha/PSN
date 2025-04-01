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
        Schema::create('daily_customers', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('full_name'); // Customer's full name
            $table->string('phone_number')->nullable(); // Customer's phone number (nullable)
            $table->string('email')->nullable(); // Customer's email (nullable)
            $table->text('address')->nullable(); // Customer's address (optional)
            $table->timestamps(); // Created at and updated at timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_customers');
    }
};
