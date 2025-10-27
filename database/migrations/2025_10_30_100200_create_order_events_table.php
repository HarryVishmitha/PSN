<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 50);
            $table->string('visibility', 20)->default('admin'); // admin | customer | public

            $table->string('old_status', 50)->nullable();
            $table->string('new_status', 50)->nullable();

            $table->string('title')->nullable();
            $table->text('message')->nullable();
            $table->json('data')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['order_id', 'visibility']);
            $table->index(['order_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_events');
    }
};

