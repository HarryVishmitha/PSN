<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
// use Throwable;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('tracking_token', 64)->nullable()->unique()->after('status');
            $table->timestamp('tracking_token_generated_at')->nullable()->after('tracking_token');
        });

        $now = now();
        $generateToken = function (): string {
            try {
                return bin2hex(random_bytes(32));
            } catch (Throwable $exception) {
                return hash('sha256', Str::uuid()->toString() . microtime(true));
            }
        };

        DB::table('orders')
            ->select('id')
            ->orderBy('id')
            ->chunkById(200, function ($orders) use ($now, $generateToken) {
                foreach ($orders as $order) {
                    DB::table('orders')
                        ->where('id', $order->id)
                        ->update([
                            'tracking_token' => $generateToken(),
                            'tracking_token_generated_at' => $now,
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['tracking_token', 'tracking_token_generated_at']);
        });
    }

};
