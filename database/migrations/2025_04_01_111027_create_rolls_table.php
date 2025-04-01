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
        Schema::create('rolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained()->onDelete('cascade');
            $table->string('roll_type');       // e.g., "Flex", "Sticker", "Canvas"
            $table->string('roll_size')->nullable(); // e.g., "2ft", "3ft", "4ft"
            $table->decimal('roll_width', 10, 2);      // Fixed width (in feet)
            $table->decimal('roll_height', 10, 2);     // Current available height (in feet)
            $table->decimal('price_rate_per_sqft', 10, 2); // Price per square foot
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rolls');
    }
};
