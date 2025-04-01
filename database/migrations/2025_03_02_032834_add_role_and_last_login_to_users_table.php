<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Add the role_id column and set a default value of 1 (assuming 'user' role has ID 1)
            $table->foreignId('role_id')->default(1)->constrained('roles')->onDelete('cascade');
            // Add the last_login timestamp column
            $table->timestamp('last_login')->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the role_id and last_login columns if rolling back
            $table->dropForeign(['role_id']);  // Drop foreign key constraint
            $table->dropColumn('role_id');
            $table->dropColumn('last_login');
        });
    }
};
