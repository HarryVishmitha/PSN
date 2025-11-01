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
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->decimal('amount_requested', 12, 2);
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'paid', 'partially_paid', 'cancelled', 'overdue'])->default('pending');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable(); // Internal notes not visible to customer
            $table->string('reference_number')->nullable(); // Payment reference/transaction ID
            $table->json('payment_details')->nullable(); // Store additional payment info
            $table->foreignId('paid_by')->nullable()->constrained('users')->onDelete('set null'); // Who marked it as paid
            $table->timestamps();
            $table->softDeletes();

            // Indexes for better performance
            $table->index('status');
            $table->index('due_date');
            $table->index(['order_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};
