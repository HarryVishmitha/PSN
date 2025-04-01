<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class RolesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Add default roles
        Role::create([
            'name' => 'user',
            'description' => 'Default role for regular users',
        ]);

        Role::create([
            'name' => 'admin',
            'description' => 'Role for system administrators',
        ]);
    }
}
