<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDesignsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('designs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image_url'); // Google Drive URL for the design
            // 'public' => available to all,
            // 'working_group' => available to working group members,
            // 'restricted' => available only to designated users (see design_access table)
            $table->enum('access_type', ['public', 'working_group', 'restricted'])->default('public');
            $table->unsignedBigInteger('working_group_id')->nullable(); // relevant when access_type = working_group
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            // Add created_at and updated_at timestamps
            $table->timestamps();
            // Optional soft deletes field
            $table->softDeletes();

            $table->foreign('working_group_id')
                  ->references('id')->on('working_groups')
                  ->onDelete('set null');

            $table->foreign('created_by')
                  ->references('id')->on('users')
                  ->onDelete('set null');

            $table->foreign('updated_by')
                  ->references('id')->on('users')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('designs');
    }
}
