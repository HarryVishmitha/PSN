<?php

namespace App\Services;

use App\Models\MessageTemplate;
use App\Models\Order;
use App\Models\User;
use App\Models\PaymentRequest;
use Illuminate\Support\Facades\Log;

class TemplateRenderer
{
    /**
     * Render a template with order data
     */
    public function renderForOrder(MessageTemplate $template, Order $order, array $additionalData = []): array
    {
        $data = $this->buildOrderData($order);
        $data = array_merge($data, $additionalData);

        return [
            'subject' => $template->renderSubject($data),
            'body' => $template->render($data),
            'data' => $data,
        ];
    }

    /**
     * Render a template with payment request data
     */
    public function renderForPaymentRequest(MessageTemplate $template, PaymentRequest $paymentRequest, array $additionalData = []): array
    {
        $order = $paymentRequest->order;
        $data = $this->buildOrderData($order);
        $data['payment_request'] = $this->buildPaymentRequestData($paymentRequest);
        $data = array_merge($data, $additionalData);

        return [
            'subject' => $template->renderSubject($data),
            'body' => $template->render($data),
            'data' => $data,
        ];
    }

    /**
     * Render a template with custom data
     */
    public function render(MessageTemplate $template, array $data): array
    {
        return [
            'subject' => $template->renderSubject($data),
            'body' => $template->render($data),
            'data' => $data,
        ];
    }

    /**
     * Preview a template with sample data
     */
    public function preview(MessageTemplate $template): array
    {
        $sampleData = $template->sample_data ?? $this->getDefaultSampleData();
        
        return [
            'subject' => $template->renderSubject($sampleData),
            'body' => $template->render($sampleData),
            'variables' => $template->extractVariables(),
            'sample_data' => $sampleData,
        ];
    }

    /**
     * Build comprehensive order data for templates
     */
    protected function buildOrderData(Order $order): array
    {
        $order->load(['customer', 'workingGroup', 'items.product']);

        return [
            'order' => [
                'id' => $order->id,
                'number' => $order->number ?? sprintf('ORD-%05d', $order->id),
                'status' => $order->status,
                'status_label' => $this->getStatusLabel($order->status),
                'subtotal' => number_format($order->subtotal_amount, 2),
                'tax' => number_format($order->tax_amount, 2),
                'discount' => number_format($order->discount_amount, 2),
                'total' => number_format($order->total_amount ?? $order->grand_total ?? 0, 2),
                'items_count' => $order->items->count(),
                'created_at' => $order->created_at->format('d M Y'),
                'placed_at' => $order->placed_at ? $order->placed_at->format('d M Y') : null,
                'notes' => $order->notes ?? '',
            ],
            'customer' => [
                'name' => $order->customer_name ?? 'Customer',
                'email' => $order->customer_email ?? '',
                'phone' => $order->customer_phone ?? '',
                'company' => $order->company_name ?? '',
                'address' => $order->billing_address_line1 ?? '',
                'city' => $order->billing_city ?? '',
                'postal_code' => $order->billing_postal_code ?? '',
            ],
            'working_group' => [
                'name' => $order->workingGroup?->name ?? 'General',
            ],
            'items' => $order->items->map(function ($item) {
                return [
                    'product_name' => $item->product?->name ?? $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => number_format($item->unit_price, 2),
                    'total' => number_format($item->line_total ?? $item->total_price ?? 0, 2),
                ];
            })->toArray(),
            'company' => [
                'name' => config('app.name', 'PrintAir Networks'),
                'email' => config('mail.from.address', 'info@printairnetworks.com'),
                'phone' => config('app.phone', '+94 77 123 4567'),
                'address' => config('app.address', 'Colombo, Sri Lanka'),
                'website' => config('app.url', 'https://printairnetworks.com'),
            ],
        ];
    }

    /**
     * Build payment request data
     */
    protected function buildPaymentRequestData(PaymentRequest $paymentRequest): array
    {
        return [
            'id' => $paymentRequest->id,
            'amount_requested' => number_format($paymentRequest->amount_requested, 2),
            'amount_paid' => number_format($paymentRequest->amount_paid, 2),
            'remaining_amount' => number_format($paymentRequest->remaining_amount, 2),
            'due_date' => $paymentRequest->due_date ? $paymentRequest->due_date->format('d M Y') : null,
            'status' => $paymentRequest->status,
            'payment_method' => $paymentRequest->payment_method ?? '',
            'reference_number' => $paymentRequest->reference_number ?? '',
            'notes' => $paymentRequest->notes ?? '',
            'created_at' => $paymentRequest->created_at->format('d M Y'),
        ];
    }

    /**
     * Get default sample data for preview
     */
    protected function getDefaultSampleData(): array
    {
        return [
            'order' => [
                'id' => 123,
                'number' => 'ORD-00123',
                'status' => 'confirmed',
                'status_label' => 'Confirmed',
                'subtotal' => '15,000.00',
                'tax' => '0.00',
                'discount' => '500.00',
                'total' => '14,500.00',
                'items_count' => 3,
                'created_at' => '01 Nov 2025',
                'placed_at' => '01 Nov 2025',
                'notes' => 'Please deliver before Friday',
            ],
            'customer' => [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '+94 77 123 4567',
                'company' => 'ABC Company Ltd',
                'address' => '123 Main Street',
                'city' => 'Colombo',
                'postal_code' => '00100',
            ],
            'working_group' => [
                'name' => 'Production Team A',
            ],
            'items' => [
                [
                    'product_name' => 'Business Cards (Premium)',
                    'quantity' => 1000,
                    'unit_price' => '10.00',
                    'total' => '10,000.00',
                ],
                [
                    'product_name' => 'Letterheads (A4)',
                    'quantity' => 500,
                    'unit_price' => '8.00',
                    'total' => '4,000.00',
                ],
            ],
            'payment_request' => [
                'id' => 1,
                'amount_requested' => '7,250.00',
                'amount_paid' => '0.00',
                'remaining_amount' => '7,250.00',
                'due_date' => '15 Nov 2025',
                'status' => 'pending',
                'payment_method' => '',
                'reference_number' => '',
                'notes' => '50% advance payment',
                'created_at' => '01 Nov 2025',
            ],
            'company' => [
                'name' => 'PrintAir Networks',
                'email' => 'info@printairnetworks.com',
                'phone' => '+94 77 123 4567',
                'address' => 'Colombo, Sri Lanka',
                'website' => 'https://printairnetworks.com',
            ],
        ];
    }

    /**
     * Get human-readable status label
     */
    protected function getStatusLabel(string $status): string
    {
        $labels = [
            'draft' => 'Draft',
            'pending' => 'Pending',
            'estimating' => 'Estimating',
            'quoted' => 'Quoted',
            'awaiting_approval' => 'Awaiting Approval',
            'payment_requested' => 'Payment Requested',
            'paid' => 'Paid',
            'confirmed' => 'Confirmed',
            'production' => 'In Production',
            'ready_for_dispatch' => 'Ready for Dispatch',
            'shipped' => 'Shipped',
            'completed' => 'Completed',
            'on_hold' => 'On Hold',
            'cancelled' => 'Cancelled',
        ];

        return $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
    }

    /**
     * Get available variables for a specific context
     */
    public function getAvailableVariables(string $context = 'order'): array
    {
        $variables = [
            'order' => [
                'order.id' => 'Order ID',
                'order.number' => 'Order Number',
                'order.status' => 'Order Status',
                'order.status_label' => 'Status Label',
                'order.subtotal' => 'Subtotal Amount',
                'order.tax' => 'Tax Amount',
                'order.discount' => 'Discount Amount',
                'order.total' => 'Grand Total',
                'order.items_count' => 'Number of Items',
                'order.created_at' => 'Order Created Date',
                'order.placed_at' => 'Order Placed Date',
                'order.notes' => 'Order Notes',
            ],
            'customer' => [
                'customer.name' => 'Customer Name',
                'customer.email' => 'Customer Email',
                'customer.phone' => 'Customer Phone',
                'customer.company' => 'Company Name',
                'customer.address' => 'Address',
                'customer.city' => 'City',
                'customer.postal_code' => 'Postal Code',
            ],
            'payment_request' => [
                'payment_request.id' => 'Payment Request ID',
                'payment_request.amount_requested' => 'Amount Requested',
                'payment_request.amount_paid' => 'Amount Paid',
                'payment_request.remaining_amount' => 'Remaining Amount',
                'payment_request.due_date' => 'Due Date',
                'payment_request.status' => 'Payment Status',
                'payment_request.notes' => 'Payment Notes',
            ],
            'company' => [
                'company.name' => 'Company Name',
                'company.email' => 'Company Email',
                'company.phone' => 'Company Phone',
                'company.address' => 'Company Address',
                'company.website' => 'Company Website',
            ],
        ];

        if ($context === 'all') {
            return array_merge(...array_values($variables));
        }

        return $variables[$context] ?? [];
    }
}
