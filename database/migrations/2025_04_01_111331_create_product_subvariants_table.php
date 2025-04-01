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
        Schema::create('product_subvariants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_variant_id');
            $table->string('subvariant_name');  // e.g., "Color"
            $table->string('subvariant_value'); // e.g., "White", "Black"
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->onDelete('cascade');
            $table->unique(['product_variant_id', 'subvariant_name', 'subvariant_value'], 'psubvariant_unique');

            // Optionally, add foreign keys for created_by/updated_by referencing users table.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_subvariants');
    }
};
