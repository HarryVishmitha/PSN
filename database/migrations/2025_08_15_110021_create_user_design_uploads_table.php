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
        Schema::create('user_design_uploads', function (Blueprint $t) {
            $t->id();
            // Context
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Track guest sessions too (so guests can attach designs before logging in)
            $t->string('session_id', 100)->nullable()->index();

            // What the user provided
            $t->enum('type', ['file', 'link', 'hire']); // hire = no file/link yet, just intent
            $t->string('external_url', 2000)->nullable();  // for links
            $t->string('file_path', 1024)->nullable();     // storage path
            $t->string('original_filename', 255)->nullable();
            $t->string('mime_type', 255)->nullable();
            $t->unsignedBigInteger('size_bytes')->nullable();

            // Optional preview/thumbnail if you generate one server-side
            $t->string('image_url', 1024)->nullable();

            // Notes from user (e.g., “matte lamination”)
            $t->text('note')->nullable();

            // Review lifecycle (if your team reviews before production)
            $t->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $t->text('review_notes')->nullable();

            // Linkage to commerce items (optional but handy)
            // $t->foreignId('cart_item_id')->nullable()->constrained('cart_items')->nullOnDelete();
            $t->foreignId('order_item_id')->nullable()->constrained('order_items')->nullOnDelete();

            // Arbitrary extras
            $t->json('meta')->nullable();

            $t->timestamps();

            // Useful compound index
            $t->index(['product_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_design_uploads');
    }
};
