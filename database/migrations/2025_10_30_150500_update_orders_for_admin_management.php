<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('discount_mode', 16)->default('none')->after('discount_amount');
            $table->decimal('discount_value', 10, 2)->default(0)->after('discount_mode');
            $table->string('tax_mode', 16)->default('none')->after('tax_amount');
            $table->decimal('tax_value', 10, 2)->default(0)->after('tax_mode');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->string('unit', 32)->nullable()->after('subvariant_id');
            $table->boolean('is_roll')->default(false)->after('line_total');
            $table->foreignId('roll_id')->nullable()->after('is_roll')->constrained('rolls')->nullOnDelete();
            $table->decimal('cut_width_in', 10, 3)->nullable()->after('roll_id');
            $table->decimal('cut_height_in', 10, 3)->nullable()->after('cut_width_in');
            $table->decimal('offcut_price_per_sqft', 10, 2)->nullable()->after('cut_height_in');
        });

        // Allow fractional quantities for mixed units (rolls, sq.ft, etc.)
        DB::statement('ALTER TABLE order_items MODIFY quantity DECIMAL(12,3) NOT NULL');
    }

    public function down(): void
    {
        // revert quantity to integer
        DB::statement('ALTER TABLE order_items MODIFY quantity INT NOT NULL');

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('roll_id');
            $table->dropColumn([
                'unit',
                'is_roll',
                'cut_width_in',
                'cut_height_in',
                'offcut_price_per_sqft',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'discount_mode',
                'discount_value',
                'tax_mode',
                'tax_value',
            ]);
        });
    }
};
