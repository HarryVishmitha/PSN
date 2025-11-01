<?php

namespace Database\Seeders;

use App\Models\MessageTemplate;
use Illuminate\Database\Seeder;

class MessageTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // Order Placed - Email
            [
                'type' => 'email',
                'name' => 'Order Placed - Customer Email',
                'slug' => 'order-placed-customer-email',
                'subject' => 'Order Confirmation - {{order.number}}',
                'body' => "Dear {{customer.name}},\n\nThank you for placing your order with {{company.name}}!\n\nYour order has been received and is being processed.\n\n**Order Details:**\n- Order Number: {{order.number}}\n- Order Date: {{order.created_at}}\n- Total Amount: LKR {{order.total}}\n- Number of Items: {{order.items_count}}\n\n**Delivery Information:**\nWe will notify you once your order is ready for dispatch.\n\nIf you have any questions, please don't hesitate to contact us at {{company.email}} or {{company.phone}}.\n\nThank you for choosing {{company.name}}!\n\nBest regards,\nThe {{company.name}} Team",
                'description' => 'Sent to customers when they place a new order',
                'trigger_event' => 'order_placed',
                'category' => 'order',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['order.number', 'order.created_at', 'order.total', 'order.items_count', 'customer.name', 'company.name', 'company.email', 'company.phone'],
            ],

            // Order Placed - WhatsApp
            [
                'type' => 'whatsapp',
                'name' => 'Order Placed - Customer WhatsApp',
                'slug' => 'order-placed-customer-whatsapp',
                'subject' => null,
                'body' => "Hi {{customer.name}}! 👋\n\nYour order {{order.number}} has been received! ✅\n\n💰 Total: LKR {{order.total}}\n📦 Items: {{order.items_count}}\n\nWe'll notify you with updates soon.\n\nThank you! 🙏\n{{company.name}}",
                'description' => 'WhatsApp notification sent to customers when order is placed',
                'trigger_event' => 'order_placed',
                'category' => 'order',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['customer.name', 'order.number', 'order.total', 'order.items_count', 'company.name'],
            ],

            // Payment Request - Email
            [
                'type' => 'email',
                'name' => 'Payment Request - Customer Email',
                'slug' => 'payment-request-customer-email',
                'subject' => 'Payment Request for Order {{order.number}}',
                'body' => "Dear {{customer.name}},\n\nWe are processing your order {{order.number}}.\n\n**Payment Request Details:**\n- Amount Requested: LKR {{payment_request.amount_requested}}\n- Due Date: {{payment_request.due_date}}\n- Status: {{payment_request.status}}\n\n{{payment_request.notes}}\n\n**Order Summary:**\n- Order Total: LKR {{order.total}}\n- Items: {{order.items_count}}\n\n**Payment Methods:**\nYou can make payment via:\n- Bank Transfer\n- Cash on Delivery\n- Online Payment\n\nFor bank transfer details, please contact us at {{company.email}} or {{company.phone}}.\n\nOnce payment is received, we will proceed with your order immediately.\n\nThank you!\n\nBest regards,\n{{company.name}}",
                'description' => 'Sent to customers when a payment request is created',
                'trigger_event' => 'payment_requested',
                'category' => 'payment',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['customer.name', 'order.number', 'order.total', 'order.items_count', 'payment_request.amount_requested', 'payment_request.due_date', 'payment_request.status', 'payment_request.notes', 'company.name', 'company.email', 'company.phone'],
            ],

            // Payment Request - WhatsApp
            [
                'type' => 'whatsapp',
                'name' => 'Payment Request - Customer WhatsApp',
                'slug' => 'payment-request-customer-whatsapp',
                'subject' => null,
                'body' => "Hi {{customer.name}}! 👋\n\n💳 Payment request for order {{order.number}}\n\n💰 Amount: LKR {{payment_request.amount_requested}}\n📅 Due: {{payment_request.due_date}}\n\n{{payment_request.notes}}\n\nPlease contact us for payment details.\n\nThank you! 🙏\n{{company.name}}\n📞 {{company.phone}}",
                'description' => 'WhatsApp notification for payment requests',
                'trigger_event' => 'payment_requested',
                'category' => 'payment',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['customer.name', 'order.number', 'payment_request.amount_requested', 'payment_request.due_date', 'payment_request.notes', 'company.name', 'company.phone'],
            ],

            // Payment Received - Email
            [
                'type' => 'email',
                'name' => 'Payment Received - Customer Email',
                'slug' => 'payment-received-customer-email',
                'subject' => 'Payment Received - Order {{order.number}}',
                'body' => "Dear {{customer.name}},\n\nThank you! We have received your payment for order {{order.number}}.\n\n**Payment Details:**\n- Amount Paid: LKR {{payment_request.amount_paid}}\n- Payment Method: {{payment_request.payment_method}}\n- Reference: {{payment_request.reference_number}}\n- Date: {{payment_request.created_at}}\n\n**Order Status:**\nYour order is now confirmed and will be processed shortly.\n\nWe will keep you updated on the progress.\n\nThank you for your business!\n\nBest regards,\n{{company.name}}",
                'description' => 'Sent to customers when payment is received',
                'trigger_event' => 'payment_received',
                'category' => 'payment',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['customer.name', 'order.number', 'payment_request.amount_paid', 'payment_request.payment_method', 'payment_request.reference_number', 'payment_request.created_at', 'company.name'],
            ],

            // Order Status Update - Email
            [
                'type' => 'email',
                'name' => 'Order Status Update - Customer Email',
                'slug' => 'order-status-update-customer-email',
                'subject' => 'Order {{order.number}} - Status Update',
                'body' => "Dear {{customer.name}},\n\nYour order status has been updated!\n\n**Order Details:**\n- Order Number: {{order.number}}\n- Current Status: {{order.status_label}}\n- Order Date: {{order.created_at}}\n- Total Amount: LKR {{order.total}}\n\n{{order.notes}}\n\nYou can track your order progress at any time by contacting us.\n\nThank you for choosing {{company.name}}!\n\nBest regards,\nThe {{company.name}} Team\n{{company.phone}} | {{company.email}}",
                'description' => 'Sent when order status changes',
                'trigger_event' => 'status_changed',
                'category' => 'order',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['customer.name', 'order.number', 'order.status_label', 'order.created_at', 'order.total', 'order.notes', 'company.name', 'company.phone', 'company.email'],
            ],

            // Order Ready for Dispatch - WhatsApp
            [
                'type' => 'whatsapp',
                'name' => 'Order Ready - Customer WhatsApp',
                'slug' => 'order-ready-customer-whatsapp',
                'subject' => null,
                'body' => "Hi {{customer.name}}! 🎉\n\nGreat news! Your order {{order.number}} is ready for dispatch! 📦\n\n✅ Status: {{order.status_label}}\n💰 Total: LKR {{order.total}}\n\nWe'll arrange delivery soon.\n\nThank you for your patience! 🙏\n{{company.name}}",
                'description' => 'WhatsApp notification when order is ready',
                'trigger_event' => 'order_ready',
                'category' => 'order',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['customer.name', 'order.number', 'order.status_label', 'order.total', 'company.name'],
            ],

            // Order Completed - Email
            [
                'type' => 'email',
                'name' => 'Order Completed - Customer Email',
                'slug' => 'order-completed-customer-email',
                'subject' => 'Order {{order.number}} Completed - Thank You!',
                'body' => "Dear {{customer.name}},\n\nYour order {{order.number}} has been completed! 🎉\n\nThank you for choosing {{company.name}}. We hope you're satisfied with your order.\n\n**Order Summary:**\n- Order Number: {{order.number}}\n- Order Date: {{order.created_at}}\n- Total Amount: LKR {{order.total}}\n- Items: {{order.items_count}}\n\nWe value your feedback! If you have any comments or concerns, please don't hesitate to reach out.\n\nWe look forward to serving you again!\n\nBest regards,\nThe {{company.name}} Team\n{{company.website}}\n{{company.phone}} | {{company.email}}",
                'description' => 'Sent when order is marked as completed',
                'trigger_event' => 'order_completed',
                'category' => 'order',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['customer.name', 'order.number', 'order.created_at', 'order.total', 'order.items_count', 'company.name', 'company.website', 'company.phone', 'company.email'],
            ],

            // Admin Order Alert - Email
            [
                'type' => 'email',
                'name' => 'New Order Alert - Admin',
                'slug' => 'new-order-admin-email',
                'subject' => '🔔 New Order Received - {{order.number}}',
                'body' => "New order received!\n\n**Order Details:**\n- Order Number: {{order.number}}\n- Customer: {{customer.name}} ({{customer.company}})\n- Email: {{customer.email}}\n- Phone: {{customer.phone}}\n- Status: {{order.status_label}}\n- Total: LKR {{order.total}}\n- Items: {{order.items_count}}\n- Date: {{order.created_at}}\n\n**Customer Notes:**\n{{order.notes}}\n\n**Working Group:** {{working_group.name}}\n\nPlease review and process this order promptly.",
                'description' => 'Admin notification for new orders',
                'trigger_event' => 'order_placed',
                'category' => 'order',
                'is_active' => true,
                'is_system' => true,
                'variables' => ['order.number', 'order.status_label', 'order.total', 'order.items_count', 'order.created_at', 'order.notes', 'customer.name', 'customer.company', 'customer.email', 'customer.phone', 'working_group.name'],
            ],
        ];

        foreach ($templates as $template) {
            MessageTemplate::updateOrCreate(
                ['slug' => $template['slug']],
                $template
            );
        }

        $this->command->info('Message templates seeded successfully!');
    }
}
