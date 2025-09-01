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
        Schema::table('estimates', function (Blueprint $t) {
            if (!Schema::hasColumn('estimates', 'client_name')) {
                $t->string('client_name')->nullable();
                $t->string('client_email')->nullable();
                $t->string('client_phone', 64)->nullable();
                $t->text('client_address')->nullable();
            }
            if (!Schema::hasColumn('estimates', 'discount_mode')) {
                $t->enum('discount_mode', ['none', 'fixed', 'percent'])->default('none');
                $t->decimal('discount_value', 12, 2)->default(0);
            }
            if (!Schema::hasColumn('estimates', 'tax_mode')) {
                $t->enum('tax_mode', ['none', 'fixed', 'percent'])->default('none');
                $t->decimal('tax_value', 12, 2)->default(0);
            }
            if (!Schema::hasColumn('estimates', 'shipping_amount')) {
                $t->decimal('shipping_amount', 12, 2)->default(0);
            }

            // internal notes already mapped to `notes` in your UI
            // uniqueness & perf
            if (!Schema::hasColumn('estimates', 'estimate_number')) {
                $t->string('estimate_number')->index(); // in case it didn't exist
                $t->unique('estimate_number');
            }
            
            $t->index(['status', 'valid_from', 'valid_to']);
        });
    }

    public function down(): void
    {
        Schema::table('estimates', function (Blueprint $t) {
            // $t->dropUnique(['estimate_number']);
            $t->dropIndex(['status', 'valid_from', 'valid_to']);
            $t->dropColumn([
                'client_name',
                'client_email',
                'client_phone',
                'client_address',
                'discount_mode',
                'discount_value',
                'tax_mode',
                'tax_value',
                'shipping_amount'
            ]);
        });
    }
};
