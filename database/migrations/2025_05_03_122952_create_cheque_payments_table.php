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
        Schema::create('cheque_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('statement_id')->constrained('statements')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('working_group_id')->constrained()->cascadeOnDelete();
            $table->string('cheque_number');
            $table->string('bank_name');
            $table->date('cheque_date');
            $table->decimal('amount',15,2);
            $table->enum('status', ['issued','cleared','bounced','cancelled']);
            $table->date('deposit_date')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cheque_payments');
    }
};
