<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('name')->nullable()->after('product_id');
            $table->text('description')->nullable()->after('name');
            $table->string('pricing_method', 50)->nullable()->after('description');
            $table->string('size_unit', 20)->nullable()->after('pricing_method');
            $table->decimal('width', 10, 3)->nullable()->after('size_unit');
            $table->decimal('height', 10, 3)->nullable()->after('width');
            $table->json('options')->nullable()->after('height');
            $table->foreignId('design_id')->nullable()->after('options')->constrained('designs')->nullOnDelete();
            $table->foreignId('user_design_upload_id')->nullable()->after('design_id')->constrained()->nullOnDelete();
            $table->boolean('hire_designer')->default(false)->after('user_design_upload_id');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['design_id']);
            $table->dropForeign(['user_design_upload_id']);
            $table->dropColumn([
                'name',
                'description',
                'pricing_method',
                'size_unit',
                'width',
                'height',
                'options',
                'design_id',
                'user_design_upload_id',
                'hire_designer',
            ]);
        });
    }
};

