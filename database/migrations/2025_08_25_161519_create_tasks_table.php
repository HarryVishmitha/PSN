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
       Schema::create('tasks', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('description')->nullable();
    $table->enum('status',['open','in_progress','blocked','completed'])->default('open');
    $table->enum('priority',['low','medium','high','urgent'])->default('medium');
    $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
    $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('due_date')->nullable();
    $table->timestamps();
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
