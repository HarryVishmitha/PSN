<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMethod;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        PaymentMethod::updateOrCreate(
            ['code' => 'cash'],
            [
                'display_name' => 'Cash',
                'type' => 'static',
                'flow' => 'cod',
                'status' => 'active',
                'locked' => true,
                'sort_order' => 1,
            ]
        );

        PaymentMethod::updateOrCreate(
            ['code' => 'card'],
            [
                'display_name' => 'Card',
                'type' => 'static',
                'flow' => 'online',
                'status' => 'inactive', // keep hidden until a gateway configured
                'locked' => true,
                'sort_order' => 2,
            ]
        );
    }
}
