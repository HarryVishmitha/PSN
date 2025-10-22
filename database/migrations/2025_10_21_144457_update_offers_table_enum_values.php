<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing values first
        DB::statement("UPDATE offers SET offer_type = 'percentage' WHERE offer_type = 'percent'");
        DB::statement("UPDATE offers SET offer_type = 'buy_x_get_y' WHERE offer_type = 'bogo'");
        DB::statement("UPDATE offers SET offer_type = 'buy_x_get_y' WHERE offer_type = 'bundle'");
        
        // Alter the enum column
        DB::statement("ALTER TABLE offers MODIFY COLUMN offer_type ENUM('percentage','fixed','buy_x_get_y','free_shipping') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to old enum values
        DB::statement("UPDATE offers SET offer_type = 'percent' WHERE offer_type = 'percentage'");
        DB::statement("UPDATE offers SET offer_type = 'bogo' WHERE offer_type = 'buy_x_get_y'");
        
        DB::statement("ALTER TABLE offers MODIFY COLUMN offer_type ENUM('percent','fixed','bogo','bundle','free_shipping') NOT NULL");
    }
};
