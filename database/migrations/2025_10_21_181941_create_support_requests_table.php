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
        Schema::create('support_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 32)->unique();
            $table->string('tracking_token', 64)->unique();
            $table->string('status', 32)->default('approved')->index();

            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->index();
            $table->string('phone_whatsapp');

            $table->string('category', 64)->index();
            $table->string('other_category')->nullable();

            $table->string('title');
            $table->text('description')->nullable();
            $table->json('specs')->nullable();

            $table->date('desired_date')->nullable();
            $table->string('flexibility', 32)->nullable();
            $table->decimal('budget_min', 12, 2)->nullable();
            $table->decimal('budget_max', 12, 2)->nullable();

            $table->timestamp('approved_at')->nullable();
            $table->timestamp('last_customer_reply_at')->nullable();
            $table->timestamp('last_admin_reply_at')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_requests');
    }
};
