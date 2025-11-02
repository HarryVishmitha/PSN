<?php

namespace Database\Factories;

use App\Models\WorkingGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkingGroup>
 */
class WorkingGroupFactory extends Factory
{
    protected $model = WorkingGroup::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->company(),
            'description' => $this->faker->sentence(),
            'wg_image' => null,
            'status' => 'active',
        ];
    }
}
