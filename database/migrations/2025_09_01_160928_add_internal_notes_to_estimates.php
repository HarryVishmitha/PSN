<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void {
        Schema::table('estimates', function (Blueprint $t) {
            if (!Schema::hasColumn('estimates', 'internal_notes')) {
                $t->text('internal_notes')->nullable();
            }
        });
    }
    public function down(): void {
        Schema::table('estimates', function (Blueprint $t) {
            $t->dropColumn('internal_notes');
        });
    }
};
