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
        Schema::create('working_groups', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('name'); // Name of the working group (e.g., Group 1, Group 2)
            $table->text('description')->nullable(); // Description of the group
            $table->timestamps(); // Created at and updated at timestamps
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('working_groups');
    }
};
