<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
use App\Models\WorkingGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'customer_type' => User::class,
            'customer_id' => User::factory(),
            'working_group_id' => WorkingGroup::factory(),
            'estimate_id' => null,
            'status' => 'pending',
            'placed_at' => null,
            'billing_address_id' => null,
            'shipping_address_id' => null,
            'subtotal_amount' => $this->faker->randomFloat(2, 5000, 10000),
            'discount_amount' => 0,
            'discount_mode' => 'none',
            'discount_value' => 0,
            'shipping_amount' => 0,
            'tax_amount' => 0,
            'tax_mode' => 'none',
            'tax_value' => 0,
            'total_amount' => $this->faker->randomFloat(2, 5000, 10000),
            'design_status' => 'hire',
            'created_by' => User::factory(),
            'updated_by' => null,
            'user_id' => null,
            'notes' => null,
            'contact_first_name' => $this->faker->firstName(),
            'contact_last_name' => $this->faker->lastName(),
            'contact_email' => $this->faker->safeEmail(),
            'contact_phone' => $this->faker->phoneNumber(),
            'contact_whatsapp' => null,
            'phone_alt_1' => null,
            'phone_alt_2' => null,
            'is_company' => false,
            'company_name' => null,
            'unlock_history' => null,
        ];
    }

    public function withPortalUser(User $user): self
    {
        return $this->state(function () use ($user) {
            return [
                'user_id' => $user->id,
                'customer_id' => $user->id,
                'customer_type' => User::class,
                'contact_email' => $user->email,
                'contact_first_name' => $user->first_name ?? $user->name,
                'contact_last_name' => $user->last_name,
            ];
        });
    }
}
