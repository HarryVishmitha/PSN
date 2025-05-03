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
        Schema::create('order_item_designs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')
                  ->constrained('order_items')
                  ->cascadeOnDelete();
            $table->foreignId('design_id')
                  ->nullable()
                  ->constrained('designs')
                  ->nullOnDelete();
            $table->text('custom_request')->nullable();
            $table->enum('status', ['requested','pending','completed'])
                  ->default('requested');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_item_designs');
    }
};
