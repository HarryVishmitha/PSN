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
        Schema::table('estimate_items', function (Blueprint $table) {
            // link to your rolls table, nullable
            $table->foreignId('roll_id')
                  ->nullable()
                  ->constrained('rolls')
                  ->nullOnDelete()
                  ->after('product_id');

            // mark this as a roll‐cut line
            $table->boolean('is_roll')
                  ->default(false)
                  ->after('roll_id');

            // actual cut dimensions
            $table->decimal('cut_width_in', 8, 2)
                  ->nullable()
                  ->after('is_roll');
            $table->decimal('cut_height_in', 8, 2)
                  ->nullable()
                  ->after('cut_width_in');

            // price per sq.ft on offcut
            $table->decimal('offcut_price_per_sqft', 10, 2)
                  ->nullable()
                  ->after('cut_height_in');
        });
    }

    public function down()
    {
        Schema::table('estimate_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('roll_id');
            $table->dropColumn(['is_roll', 'cut_width_in', 'cut_height_in', 'offcut_price_per_sqft']);
        });
    }
};
