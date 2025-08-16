<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $t) {
            // If these already exist in your DB, Laravel will throw; add guards or remove.
            if (!Schema::hasColumn('cart_items', 'variant_id')) {
                $t->unsignedBigInteger('variant_id')->nullable()->after('product_id');
            }
            if (!Schema::hasColumn('cart_items', 'subvariant_id')) {
                $t->unsignedBigInteger('subvariant_id')->nullable()->after('variant_id');
            }
            if (!Schema::hasColumn('cart_items', 'variant_sku')) {
                $t->string('variant_sku', 191)->nullable()->after('subvariant_id');
            }

            // JSON of picked options (eg {Size:"XL", Color:"Black", Lamination:"Matte"})
            if (!Schema::hasColumn('cart_items', 'options')) {
                // If your MySQL is old and lacks JSON, change to ->text('options')
                $t->json('options')->nullable()->after('variant_sku');
            }

            // Canonical fingerprint of options to match/stack identical lines
            if (!Schema::hasColumn('cart_items', 'options_fingerprint')) {
                $t->string('options_fingerprint', 64)->nullable()->after('options');
            }

            // Helpful composite index for stacking lookups
            if (!Schema::hasColumn('cart_items', 'options_fingerprint')) {
                // (guard above ensures column exists before index)
            }
            $t->index(
                ['product_id','variant_id','subvariant_id','options_fingerprint','size_unit','width','height','user_design_upload_id'],
                'ci_stack_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $t) {
            if (Schema::hasColumn('cart_items', 'ci_stack_idx')) {
                $t->dropIndex('ci_stack_idx');
            }
            foreach (['options_fingerprint','options','variant_sku','subvariant_id','variant_id'] as $col) {
                if (Schema::hasColumn('cart_items', $col)) {
                    $t->dropColumn($col);
                }
            }
        });
    }
};
