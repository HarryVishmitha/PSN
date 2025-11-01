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
        Schema::create('message_templates', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['email', 'whatsapp'])->default('email');
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('subject')->nullable(); // For emails only
            $table->text('body'); // Template content with {{variables}}
            $table->text('description')->nullable(); // Template description for admins
            $table->json('variables')->nullable(); // Available variables for this template
            $table->json('sample_data')->nullable(); // Sample data for preview
            $table->string('trigger_event')->nullable(); // order_placed, payment_received, status_changed, etc.
            $table->string('category')->default('general'); // general, order, payment, notification
            $table->boolean('is_active')->default(true);
            $table->boolean('is_system')->default(false); // System templates can't be deleted
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('type');
            $table->index('trigger_event');
            $table->index('category');
            $table->index('is_active');
            $table->index(['type', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_templates');
    }
};
