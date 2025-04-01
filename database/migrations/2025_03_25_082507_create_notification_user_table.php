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
        Schema::create('notification_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')
                  ->constrained('notifications')
                  ->onDelete('cascade');  // Delete pivot if notification is removed
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');  // Delete pivot if user is removed
            $table->enum('status', ['unread', 'read'])->default('unread');  // Read status
            $table->timestamp('read_at')->nullable();  // Time when notification was read
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_user');
    }
};
