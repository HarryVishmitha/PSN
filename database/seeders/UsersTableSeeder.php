<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\WorkingGroup;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure roles exist and get their IDs
        $userRoleId  = optional(Role::firstOrCreate(['name' => 'user']))->id;
        $adminRoleId = optional(Role::firstOrCreate(['name' => 'admin']))->id;

        // Ensure at least one working group exists
        $defaultWg = WorkingGroup::firstOrCreate(
            ['name' => 'General'],
            ['description' => 'Default working group']
        );

        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@printair.lk',
                'email_verified_at' => now(),
                'password' => bcrypt('password'), // default password
                'remember_token' => Str::random(10),
                'role_id' => $adminRoleId,
                'status' => 'active',
                'working_group_id' => $defaultWg->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Kasun Perera',
                'email' => 'kasun@printair.lk',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
                'remember_token' => Str::random(10),
                'role_id' => $userRoleId,
                'status' => 'active',
                'working_group_id' => $defaultWg->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Nimali Silva',
                'email' => 'nimali@printair.lk',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
                'remember_token' => Str::random(10),
                'role_id' => $userRoleId,
                'status' => 'active',
                'working_group_id' => $defaultWg->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Thejan Vishmitha',
                'email' => 'thejan@printair.lk',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
                'remember_token' => Str::random(10),
                'role_id' => $userRoleId,
                'status' => 'active',
                'working_group_id' => $defaultWg->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Akila Fernando',
                'email' => 'akila@printair.lk',
                'email_verified_at' => now(),
                'password' => bcrypt('password'),
                'remember_token' => Str::random(10),
                'role_id' => $userRoleId,
                'status' => 'active',
                'working_group_id' => $defaultWg->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Upsert by email to be idempotent
        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                $user
            );
        }
    }
}
