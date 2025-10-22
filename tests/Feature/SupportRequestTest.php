<?php

namespace Tests\Feature;

use App\Mail\SupportRequestAdminAlert;
use App\Mail\SupportRequestSubmitted;
use App\Mail\SupportRequestUpdated;
use App\Models\SupportRequest;
use App\Models\SupportRequestMessage;
use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SupportRequestTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function a_customer_can_submit_a_support_request()
    {
        Storage::fake('public');
        Mail::fake();

        $payload = [
            'name' => 'Alex Rivera',
            'company' => 'Rivera Labs',
            'email' => 'alex@example.com',
            'phone_whatsapp' => '+94770000000',
            'category' => 'x-banner',
            'title' => 'Product launch banners',
            'description' => 'Need two banners for the product launch stage.',
            'specs' => [
                'size' => ['width' => 2, 'height' => 6, 'unit' => 'ft'],
                'quantity' => 2,
                'sides' => 1,
                'color' => 'CMYK',
                'material' => 'Flex',
                'finishing' => 'Eyelets',
                'delivery_type' => 'courier',
            ],
            'desired_date' => now()->addDays(5)->toDateString(),
            'flexibility' => 'plusminus',
            'budget_min' => 15000,
            'budget_max' => 25000,
            'consent' => true,
        ];

        $file = UploadedFile::fake()->create('artwork.pdf', 1000, 'application/pdf');

        $response = $this->post(route('requests.store'), array_merge($payload, [
            'files' => [$file],
        ]));

        $response->assertRedirect();

        $supportRequest = SupportRequest::first();
        $this->assertNotNull($supportRequest);
        $this->assertEquals('Alex Rivera', $supportRequest->name);
        $this->assertEquals('approved', $supportRequest->status);
        $this->assertNotNull($supportRequest->approved_at);
        $this->assertSame('+94770000000', $supportRequest->phone_whatsapp);

        Storage::disk('public')->assertExists($supportRequest->files()->first()->path);

        Mail::assertSent(SupportRequestAdminAlert::class, function ($mail) use ($supportRequest) {
            return $mail->supportRequest->is($supportRequest);
        });

        Mail::assertSent(SupportRequestSubmitted::class, function ($mail) use ($supportRequest) {
            return $mail->supportRequest->is($supportRequest);
        });
    }

}

