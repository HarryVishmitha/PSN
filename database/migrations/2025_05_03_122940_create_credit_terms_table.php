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
        Schema::create('credit_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('working_group_id')->constrained()->cascadeOnDelete();
            $table->decimal('credit_limit',15,2);
            $table->enum('billing_cycle', ['monthly','net30','net45','net60','custom']);
            $table->tinyInteger('billing_day')->nullable();
            $table->integer('custom_term_days')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_terms');
    }
};
