<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
{
    if (!Schema::hasTable('design_access')) return;

    // Helpers to check FK / index existence
    $fkExists = function (string $table, string $constraint) {
        $sql = "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?";
        return !empty(DB::select($sql, [$table, $constraint]));
    };
    $indexExists = function (string $table, string $index) {
        $sql = "SELECT INDEX_NAME FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?";
        return !empty(DB::select($sql, [$table, $index]));
    };

    Schema::table('design_access', function (Blueprint $table) {
        if (!Schema::hasColumn('design_access', 'design_id')) {
            $table->unsignedBigInteger('design_id')->index();
        }
        if (!Schema::hasColumn('design_access', 'user_id')) {
            $table->unsignedBigInteger('user_id')->index();
        }
    });

    // Add unique composite only if missing
    if (!$indexExists('design_access', 'design_access_unique')) {
        Schema::table('design_access', function (Blueprint $table) {
            $table->unique(['design_id', 'user_id'], 'design_access_unique');
        });
    }

    // Add FKs only if missing (names may already exist in your schema)
    if (!$fkExists('design_access', 'design_access_design_id_foreign')) {
        Schema::table('design_access', function (Blueprint $table) {
            $table->foreign('design_id')
                  ->references('id')->on('designs')
                  ->onDelete('cascade');
        });
    }
    if (!$fkExists('design_access', 'design_access_user_id_foreign')) {
        Schema::table('design_access', function (Blueprint $table) {
            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');
        });
    }
}


    public function down(): void
    {
        if (Schema::hasTable('design_access')) {
            Schema::table('design_access', function (Blueprint $table) {
                // Drop unique & FKs safely
                try { $table->dropForeign(['design_id']); } catch (\Throwable $e) {}
                try { $table->dropForeign(['user_id']); } catch (\Throwable $e) {}
                try { $table->dropUnique('design_access_unique'); } catch (\Throwable $e) {}
            });
        }
    }
};
