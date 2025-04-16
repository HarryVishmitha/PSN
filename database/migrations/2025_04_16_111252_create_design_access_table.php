<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDesignAccessTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('design_access', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('design_id'); // reference to designs table
            $table->unsignedBigInteger('user_id');     // user granted access
            // Add created_at and updated_at timestamps
            $table->timestamps();
            // Optional soft deletes field
            $table->softDeletes();

            $table->foreign('design_id')
                  ->references('id')->on('designs')
                  ->onDelete('cascade');

            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('design_access');
    }
}
