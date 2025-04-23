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
        Schema::table('designs', function (Blueprint $table) {
            // Add numeric columns (e.g. in millimeters)
            $table->decimal('width', 8, 2)->after('description');   // adjust precision as needed
            $table->decimal('height', 8, 2)->after('width');

            // Link to products table
            $table->unsignedBigInteger('product_id')->after('height');
            $table->foreign('product_id')
                  ->references('id')
                  ->on('products')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('designs', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn(['width', 'height', 'product_id']);
        });
    }
};
