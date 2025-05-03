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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_type');
            $table->unsignedBigInteger('customer_id');
            $table->foreignId('working_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('estimate_id')->nullable()->constrained('estimates')->nullOnDelete();
            $table->enum('status', ['pending','confirmed','cancelled','returned'])->default('pending');
            $table->dateTime('placed_at')->nullable();
            $table->foreignId('billing_address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->foreignId('shipping_address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->decimal('subtotal_amount',15,2);
            $table->decimal('discount_amount',15,2)->default(0);
            $table->decimal('tax_amount',15,2)->default(0);
            $table->enum('design_status', ['existing', 'hire', 'submit'])->default('hire');
            $table->decimal('total_amount',15,2);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
