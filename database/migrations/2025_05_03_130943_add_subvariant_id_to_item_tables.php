<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Estimate Items
        Schema::table('estimate_items', function (Blueprint $table) {
            $table->foreignId('subvariant_id')
                  ->nullable()
                  ->after('variant_id')
                  ->constrained('product_subvariants')
                  ->nullOnDelete();
        });

        // Order Items
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('subvariant_id')
                  ->nullable()
                  ->after('variant_id')
                  ->constrained('product_subvariants')
                  ->nullOnDelete();
        });

        // Invoice Items
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->foreignId('subvariant_id')
                  ->nullable()
                  ->after('variant_id')
                  ->constrained('product_subvariants')
                  ->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::table('estimate_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subvariant_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subvariant_id');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subvariant_id');
        });
    }
};
