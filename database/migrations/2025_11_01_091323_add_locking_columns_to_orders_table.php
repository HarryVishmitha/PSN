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
        Schema::table('orders', function (Blueprint $table) {
            // Locking mechanism columns
            $table->timestamp('locked_at')->nullable()->after('status');
            $table->decimal('locked_total', 15, 2)->nullable()->after('locked_at');
            $table->foreignId('locked_by')->nullable()->after('locked_total')->constrained('users')->nullOnDelete();
            
            // Additional order management columns
            $table->string('cancellation_reason', 500)->nullable()->after('notes');
            $table->text('unlock_history')->nullable()->after('cancellation_reason')->comment('JSON log of unlock events');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['locked_by']);
            $table->dropColumn(['locked_at', 'locked_total', 'locked_by', 'cancellation_reason', 'unlock_history']);
        });
    }
};
