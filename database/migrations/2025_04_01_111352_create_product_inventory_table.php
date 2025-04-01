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
        Schema::create('product_inventory', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('product_variant_id')->nullable();
            $table->unsignedBigInteger('product_subvariant_id')->nullable();
            $table->integer('quantity')->default(0);
            $table->integer('reorder_threshold')->default(0);
            $table->json('unit_details')->nullable(); // e.g., {"width": "24in", "length": "50ft"}
            $table->unsignedBigInteger('provider_id')->nullable();
            $table->timestamp('last_updated')->useCurrent();
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('product_variant_id')->references('id')->on('product_variants')->onDelete('set null');
            $table->foreign('product_subvariant_id')->references('id')->on('product_subvariants')->onDelete('set null');
            $table->foreign('provider_id')->references('id')->on('providers')->onDelete('set null');
            // Optionally, add foreign keys for created_by/updated_by referencing users table.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_inventory');
    }
};
