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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('variant_name');   // e.g., "Size"
            $table->string('variant_value');  // e.g., "Large", "Small"
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->unique(['product_id', 'variant_name', 'variant_value']);
            // Optionally, add foreign keys for created_by/updated_by referencing users table.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
