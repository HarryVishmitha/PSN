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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()
                  ->constrained('users')
                  ->onDelete('set null');  // Keep log even if user is deleted
            $table->string('action_type');  // e.g., 'notification_sent', 'notification_read'
            $table->text('description')->nullable();  // Optional detailed log message
            $table->ipAddress('ip_address')->nullable();  // Optional IP for audit trails
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
