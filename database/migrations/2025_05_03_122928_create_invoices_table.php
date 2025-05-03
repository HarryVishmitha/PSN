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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('customer_type');
            $table->unsignedBigInteger('customer_id');
            $table->foreignId('working_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('estimate_id')->nullable()->constrained('estimates')->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->enum('status', ['draft','issued','paid','overdue'])->default('draft');
            $table->dateTime('issued_at')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('subtotal_amount',15,2);
            $table->decimal('discount_amount',15,2)->default(0);
            $table->decimal('tax_amount',15,2)->default(0);
            $table->decimal('total_amount',15,2);
            $table->string('payment_terms')->nullable();
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
        Schema::dropIfExists('invoices');
    }
};
