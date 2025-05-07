<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SetEstimatesAutoIncrement extends Migration
{
    public function up(): void
    {
        // MySQL
        DB::statement('ALTER TABLE `estimates` AUTO_INCREMENT = 1600;');

        // If you use Postgres instead, you’d do something like:
        // DB::statement("ALTER SEQUENCE estimates_id_seq RESTART WITH 1600;");
    }

    public function down(): void
    {
        // you can reset it back to 1 (or whatever)
        DB::statement('ALTER TABLE `estimates` AUTO_INCREMENT = 1;');
        // or for Postgres:
        // DB::statement("ALTER SEQUENCE estimates_id_seq RESTART WITH 1;");
    }
}
