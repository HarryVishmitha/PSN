<?php

namespace Tests\Feature;

use App\Mail\OrderTrackingCode;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderTrackingTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function guest_can_request_tracking_code(): void
    {
        Mail::fake();

        $order = Order::factory()->create([
            'contact_email' => 'guest@example.test',
        ]);

        $response = $this->postJson(route('order-tracking.request-code'), [
            'order_reference' => (string) $order->number,
            'email' => 'guest@example.test',
        ]);

        $response->assertOk()->assertJsonFragment([
            'message' => 'We have emailed a verification code to you. Please check your inbox.',
        ]);

        Mail::assertQueued(OrderTrackingCode::class, function (OrderTrackingCode $mail) use ($order) {
            return $mail->order->is($order);
        });

        $cacheKey = "order-tracking:otp:{$order->id}:" . hash('sha256', 'guest@example.test');
        $this->assertNotNull(Cache::get($cacheKey));
    }

    /** @test */
    public function guest_can_verify_code_and_receive_signed_link(): void
    {
        Mail::fake();

        $order = Order::factory()->create([
            'contact_email' => 'guest@example.test',
        ]);

        $originalToken = $order->tracking_token;

        $this->postJson(route('order-tracking.request-code'), [
            'order_reference' => (string) $order->number,
            'email' => 'guest@example.test',
        ])->assertOk();

        $code = null;
        Mail::assertQueued(OrderTrackingCode::class, function (OrderTrackingCode $mail) use (&$code) {
            $code = $mail->code;
            return true;
        });

        $this->assertNotNull($code);

        $verifyResponse = $this->postJson(route('order-tracking.verify-code'), [
            'order_reference' => (string) $order->number,
            'email' => 'guest@example.test',
            'code' => $code,
        ]);

        $verifyResponse->assertOk();
        $redirect = $verifyResponse->json('redirect');

        $this->assertNotEmpty($redirect);
        $this->assertStringContainsString('/order-tracking/orders/', $redirect);

        $order->refresh();
        $this->assertNotSame($originalToken, $order->tracking_token);

        $cacheKey = "order-tracking:otp:{$order->id}:" . hash('sha256', 'guest@example.test');
        $this->assertNull(Cache::get($cacheKey));
    }
}
