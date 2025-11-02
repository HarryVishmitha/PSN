<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('orders', 'number')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('number', 32)->nullable()->unique()->after('id');
            });
        }

        DB::table('orders')
            ->select('id', 'number')
            ->orderBy('id')
            ->chunkById(200, function ($orders) {
                foreach ($orders as $order) {
                    if (!empty($order->number)) {
                        continue;
                    }

                    DB::table('orders')
                        ->where('id', $order->id)
                        ->update([
                            'number' => sprintf('ORD-%05d', $order->id),
                        ]);
                }
            });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('orders', 'number')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique('orders_number_unique');
            $table->dropColumn('number');
        });
    }
};
