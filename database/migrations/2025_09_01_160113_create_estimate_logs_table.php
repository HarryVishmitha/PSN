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
        Schema::create('estimate_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('estimate_id')->constrained()->cascadeOnDelete();
            $t->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('type', 64);           // created, pdf_generated, etc.
            $t->string('from_status', 32)->nullable();
            $t->string('to_status', 32)->nullable();
            $t->json('payload')->nullable();  // tiny metadata (amounts, url, ip, etc.)
            $t->string('ip_address', 64)->nullable();
            $t->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('estimate_logs');
    }
};
