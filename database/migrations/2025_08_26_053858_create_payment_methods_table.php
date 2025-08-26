<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payment_methods', function (Blueprint $t) {
            $t->id();
            $t->string('code')->unique();                 // e.g. cash, card, bank_transfer, qr, payhere, stripe
            $t->string('display_name');                   // “Cash on Delivery”, “Card”
            $t->string('type');                           // static | custom | gateway
            $t->string('flow');                           // cod | manual | online
            $t->string('status')->default('inactive');    // active | inactive
            $t->boolean('locked')->default(false);        // true for cash/card
            $t->string('logo_path')->nullable();
            $t->text('instructions')->nullable();         // shown at checkout for manual flows
            $t->string('fee_type')->nullable();           // none | flat | percent
            $t->decimal('fee_value', 10, 2)->nullable();
            $t->decimal('min_order_total', 10, 2)->nullable();
            $t->decimal('max_order_total', 10, 2)->nullable();
            $t->json('allowed_currencies')->nullable();   // ["LKR"]
            $t->json('config')->nullable();               // gateway keys or bank details
            $t->integer('sort_order')->default(0);
            $t->softDeletes();
            $t->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('payment_methods');
    }
};
