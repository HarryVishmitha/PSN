<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ===== carts =====
        Schema::create('carts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('session_id', 100)->nullable()->index(); // guests
            $t->string('currency_code', 3)->default('LKR');
            $t->enum('status', ['open','converted','abandoned','merged'])->default('open');
            $t->boolean('is_quote')->default(false);

            // totals (snapshots, server is source of truth)
            $t->decimal('subtotal', 12, 2)->default(0);
            $t->decimal('discount_total', 12, 2)->default(0);
            $t->decimal('tax_total', 12, 2)->default(0);
            $t->decimal('shipping_total', 12, 2)->default(0);
            $t->decimal('grand_total', 12, 2)->default(0);

            $t->json('meta')->nullable(); // anything extra (channel, device, etc.)
            $t->timestamps();

            $t->index(['user_id', 'status']);
        });

        // ===== cart_items =====
        Schema::create('cart_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('cart_id')->constrained('carts')->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();

            // Snapshots against product at add-time
            $t->string('product_name')->nullable();
            $t->string('sku', 100)->nullable();

            $t->enum('pricing_method', ['standard','roll'])->default('standard');
            $t->unsignedInteger('quantity')->default(1);

            // Roll specifics
            $t->enum('size_unit', ['in','ft'])->nullable();
            $t->decimal('width', 12, 3)->nullable();
            $t->decimal('height', 12, 3)->nullable();
            $t->decimal('area', 12, 4)->nullable(); // computed

            // Money snapshots
            $t->decimal('unit_price', 12, 2)->default(0);
            $t->decimal('total_price', 12, 2)->default(0);

            // Variant/options chosen
            $t->json('selected_options')->nullable();

            // Attachments: either gallery template OR user upload/link/hire
            $t->foreignId('design_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('user_design_upload_id')->nullable()->constrained('user_design_uploads')->nullOnDelete();

            $t->enum('status', ['active','backorder','discontinued'])->default('active');
            $t->json('meta')->nullable();
            $t->timestamps();

            $t->index(['cart_id', 'product_id']);
        });

        // Ensure the upload can point back to the cart item (if your earlier table missed it)
        if (!Schema::hasColumn('user_design_uploads', 'cart_item_id')) {
            Schema::table('user_design_uploads', function (Blueprint $t) {
                $t->foreignId('cart_item_id')->nullable()->constrained('cart_items')->nullOnDelete();
            });
        }

        // ===== cart_item_adjustments (per-item discounts/surcharges/taxes) =====
        Schema::create('cart_item_adjustments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('cart_item_id')->constrained('cart_items')->cascadeOnDelete();
            $t->enum('type', ['discount','surcharge','fee','tax']);
            $t->string('code', 100)->nullable();  // e.g., coupon code
            $t->string('label', 255)->nullable(); // human-readable
            $t->decimal('amount', 12, 2);         // signed (discount negative)
            $t->json('meta')->nullable();
            $t->timestamps();
        });

        // ===== cart_adjustments (cart-level discounts/shipping/tax/etc.) =====
        Schema::create('cart_adjustments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('cart_id')->constrained('carts')->cascadeOnDelete();
            $t->enum('type', ['discount','shipping','fee','tax']);
            $t->string('code', 100)->nullable();
            $t->string('label', 255)->nullable();
            $t->decimal('amount', 12, 2); // signed
            $t->json('meta')->nullable();
            $t->timestamps();
        });

        // ===== cart_addresses (billing/shipping snapshots pre-checkout) =====
        Schema::create('cart_addresses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('cart_id')->constrained('carts')->cascadeOnDelete();
            $t->enum('type', ['shipping','billing']);
            $t->string('name')->nullable();
            $t->string('company')->nullable();
            $t->string('email')->nullable();
            $t->string('phone')->nullable();
            $t->string('line1')->nullable();
            $t->string('line2')->nullable();
            $t->string('city')->nullable();
            $t->string('region')->nullable();      // province/state
            $t->string('postal_code')->nullable();
            $t->string('country_code', 2)->default('LK');
            $t->json('meta')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_addresses');
        Schema::dropIfExists('cart_adjustments');
        Schema::dropIfExists('cart_item_adjustments');
        if (Schema::hasColumn('user_design_uploads','cart_item_id')) {
            Schema::table('user_design_uploads', function (Blueprint $t) {
                $t->dropConstrainedForeignId('cart_item_id');
            });
        }
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
    }
};
