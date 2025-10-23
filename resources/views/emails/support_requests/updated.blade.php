<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Request Update</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f44032 0%, #ff6b5e 100%); padding: 40px 30px; text-align: center;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="{{ asset('images/printairlogo.png') }}" alt="Printair Logo" style="max-width: 150px; height: auto;">
            </div>
            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: bold; text-align: center;">Update on Your Request</h1>
            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; text-align: center;"><strong>{{ $request->reference }}</strong></p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
            
            <!-- Intro Message -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #374151; font-size: 16px; text-align: center; line-height: 1.6;">Our team just shared a new update on your request.</p>
            </div>

            <!-- Latest Message Section -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: bold; color: #111827; text-align: center;">Latest Message</h2>
                <div style="padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #374151; line-height: 1.8; font-size: 15px;">{{ $message->body }}</p>
                </div>
            </div>

            <!-- Status Section -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
                <div style="padding: 16px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; text-transform: uppercase; font-weight: 700; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 8px; text-align: center;">Current Status</div>
                    <div style="font-size: 18px; color: #f44032; font-weight: 600; text-align: center;">{{ ucfirst(str_replace('_', ' ', $request->status)) }}</div>
                </div>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $trackingUrl }}" style="display: inline-block; background: linear-gradient(135deg, #f44032 0%, #ff6b5e 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(244, 64, 50, 0.3);">View Full Timeline</a>
            </div>

            <!-- Reply Note -->
            <div style="background-color: #fef3f2; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #fee4e2;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; text-align: center; line-height: 1.6;">💬 You can reply directly to this email if you have more details to add.</p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-align: center;">Thanks,</p>
            <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600; text-align: center;">{{ config('app.name') }} Support Team</p>
        </div>
    </div>
</body>
</html>
