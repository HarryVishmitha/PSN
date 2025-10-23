<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SupportRequest>
 */
class SupportRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $category = Arr::random(array_keys(config('support-requests.categories', ['x-banner' => []])));

        return [
            'name' => $this->faker->name(),
            'company' => $this->faker->company(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone_whatsapp' => '+94' . $this->faker->numberBetween(700000000, 799999999),
            'category' => $category,
            'other_category' => $category === 'other' ? $this->faker->words(3, true) : null,
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'specs' => [
                'size' => [
                    'width' => $this->faker->randomFloat(1, 1, 5),
                    'height' => $this->faker->randomFloat(1, 2, 8),
                    'unit' => $this->faker->randomElement(['ft', 'cm', 'mm']),
                ],
                'quantity' => $this->faker->numberBetween(1, 10),
                'sides' => $this->faker->randomElement([1, 2]),
                'color' => $this->faker->randomElement(['CMYK', 'RGB', 'Pantone']),
                'material' => $this->faker->word(),
                'finishing' => $this->faker->randomElement(['lamination', 'eyelets', 'die-cut', null]),
                'delivery_type' => $this->faker->randomElement(['pickup', 'courier', 'install']),
            ],
            'desired_date' => $this->faker->dateTimeBetween('+1 day', '+2 weeks'),
            'flexibility' => $this->faker->randomElement(['exact', 'plusminus']),
            'budget_min' => $this->faker->numberBetween(5000, 10000),
            'budget_max' => $this->faker->numberBetween(12000, 25000),
            'status' => 'approved',
            'approved_at' => now(),
            'last_customer_reply_at' => now(),
            'metadata' => ['consent' => true],
        ];
    }
}
