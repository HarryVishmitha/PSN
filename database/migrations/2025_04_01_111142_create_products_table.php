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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('working_group_id')->nullable(); // NULL for public products
            $table->string('name');
            $table->text('description')->nullable();
            // For non-roll products, use 'price'; for roll-based products, use 'price_per_sqft' with pricing_method = 'roll'
            $table->decimal('price', 10, 2)->nullable();
            $table->string('pricing_method')->default('standard'); // 'standard' or 'roll'
            $table->decimal('price_per_sqft', 10, 2)->nullable();
            $table->string('unit_of_measure')->default('piece');
            $table->json('metadata')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->timestamps();
            $table->softDeletes();
            // Audit columns:
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
