<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estimate_items', function (Blueprint $t) {
            if (!Schema::hasColumn('estimate_items', 'unit')) {
                $t->string('unit', 32)->nullable()->after('quantity');
            }
            if (!Schema::hasColumn('estimate_items', 'is_roll')) {
                $t->boolean('is_roll')->default(false)->after('line_total');
            }
            if (!Schema::hasColumn('estimate_items', 'roll_id')) {
                // If you already have rolls table and want FK, replace with:
                // $t->foreignId('roll_id')->nullable()->constrained('rolls')->nullOnDelete();
                $t->unsignedBigInteger('roll_id')->nullable()->after('is_roll');
            }
            if (!Schema::hasColumn('estimate_items', 'cut_width_in')) {
                $t->decimal('cut_width_in', 10, 2)->nullable()->after('roll_id');
            }
            if (!Schema::hasColumn('estimate_items', 'cut_height_in')) {
                $t->decimal('cut_height_in', 10, 2)->nullable()->after('cut_width_in');
            }
            if (!Schema::hasColumn('estimate_items', 'offcut_price_per_sqft')) {
                $t->decimal('offcut_price_per_sqft', 12, 2)->nullable()->after('cut_height_in');
            }

            // If quantity/unit_price/line_total exist but as int, you can widen them here:
            // $t->decimal('quantity', 12, 3)->change();
            // $t->decimal('unit_price', 12, 2)->change();
            // $t->decimal('line_total', 12, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('estimate_items', function (Blueprint $t) {
            if (Schema::hasColumn('estimate_items', 'offcut_price_per_sqft')) $t->dropColumn('offcut_price_per_sqft');
            if (Schema::hasColumn('estimate_items', 'cut_height_in'))          $t->dropColumn('cut_height_in');
            if (Schema::hasColumn('estimate_items', 'cut_width_in'))           $t->dropColumn('cut_width_in');
            if (Schema::hasColumn('estimate_items', 'roll_id'))                $t->dropColumn('roll_id');
            if (Schema::hasColumn('estimate_items', 'is_roll'))                $t->dropColumn('is_roll');
            if (Schema::hasColumn('estimate_items', 'unit'))                   $t->dropColumn('unit');
        });
    }
};
