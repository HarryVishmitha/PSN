<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('estimates', 'notes')) {
            return;
        }

        $afterColumn = Schema::hasColumn('estimates', 'shipping_amount')
            ? 'shipping_amount'
            : (Schema::hasColumn('estimates', 'tax_value') ? 'tax_value' : 'total_amount');

        Schema::table('estimates', function (Blueprint $table) use ($afterColumn) {
            $table->text('notes')->nullable()->after($afterColumn);
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('estimates', 'notes')) {
            return;
        }

        Schema::table('estimates', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
