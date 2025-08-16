<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Ensure index exists (optional; MySQL will create one if missing)
        Schema::table('user_design_uploads', function (Blueprint $t) {
            if (!Schema::hasColumn('user_design_uploads', 'cart_item_id')) {
                $t->unsignedBigInteger('cart_item_id')->nullable()->index();
            }
        });

        // Drop FK if it exists under the default name (from previous attempts)
        try {
            Schema::table('user_design_uploads', function (Blueprint $t) {
                $t->dropForeign(['cart_item_id']); // drops *_foreign if present
            });
        } catch (\Throwable $e) {
            // ignore if it doesn't exist
        }

        // Add FK with a UNIQUE custom name to avoid schema-level name collisions
        Schema::table('user_design_uploads', function (Blueprint $t) {
            $t->foreign('cart_item_id', 'fk_ud_uploads_cart_item_20250815')
              ->references('id')->on('cart_items')
              ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_design_uploads', function (Blueprint $t) {
            // drop by the custom name
            try { $t->dropForeign('fk_ud_uploads_cart_item_20250815'); } catch (\Throwable $e) {}
            // (optional) $t->dropIndex(['cart_item_id']);
        });
    }
};
