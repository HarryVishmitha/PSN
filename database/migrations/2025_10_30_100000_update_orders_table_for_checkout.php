<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // widen status column so new states can be introduced without schema churn
        DB::statement("ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'");

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('customer_id')->constrained()->nullOnDelete();
            $table->decimal('shipping_amount', 15, 2)->default(0)->after('discount_amount');
            $table->foreignId('shipping_method_id')->nullable()->after('shipping_amount')->constrained()->nullOnDelete();

            $table->boolean('is_company')->default(false)->after('design_status');
            $table->string('company_name')->nullable()->after('is_company');
            $table->text('notes')->nullable()->after('company_name');

            $table->string('contact_first_name', 120)->nullable()->after('notes');
            $table->string('contact_last_name', 120)->nullable()->after('contact_first_name');
            $table->string('contact_email')->nullable()->after('contact_last_name');
            $table->string('contact_phone', 50)->nullable()->after('contact_email');
            $table->string('contact_whatsapp', 50)->nullable()->after('contact_phone');
            $table->string('phone_alt_1', 50)->nullable()->after('contact_whatsapp');
            $table->string('phone_alt_2', 50)->nullable()->after('phone_alt_1');
        });

        // adjust created_by to allow guest checkouts
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });
        DB::statement('ALTER TABLE orders MODIFY created_by BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_created_by_foreign FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL');
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['shipping_method_id']);
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'user_id',
                'shipping_amount',
                'shipping_method_id',
                'is_company',
                'company_name',
                'notes',
                'contact_first_name',
                'contact_last_name',
                'contact_email',
                'contact_phone',
                'contact_whatsapp',
                'phone_alt_1',
                'phone_alt_2',
            ]);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });
        DB::statement('ALTER TABLE orders MODIFY created_by BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE orders ADD CONSTRAINT orders_created_by_foreign FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE');

        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending','confirmed','cancelled','returned') NOT NULL DEFAULT 'pending'");
    }
};
