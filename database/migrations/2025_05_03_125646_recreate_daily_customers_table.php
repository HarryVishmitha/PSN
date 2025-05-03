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
        // Drop the old table completely
        Schema::dropIfExists('daily_customers');

        // Create the corrected version
        Schema::create('daily_customers', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('phone_number', 50);
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->date('visit_date');
            $table->timestamps();
            $table->softDeletes(); // adds deleted_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_customers');
    }
};
