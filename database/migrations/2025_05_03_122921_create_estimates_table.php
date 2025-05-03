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
        Schema::create('estimates', function (Blueprint $table) {
            $table->id();
            $table->string('customer_type');
            $table->unsignedBigInteger('customer_id');
            $table->foreignId('working_group_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['draft','published','expired'])->default('draft');
            $table->dateTime('valid_from');
            $table->dateTime('valid_to');
            $table->foreignId('billing_address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->decimal('subtotal_amount',15,2);
            $table->decimal('discount_amount',15,2)->default(0);
            $table->decimal('tax_amount',15,2)->default(0);
            $table->decimal('total_amount',15,2);
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->dateTime('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimates');
    }
};
