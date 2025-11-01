<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Order Status Definitions
    |--------------------------------------------------------------------------
    |
    | Define all possible order statuses with their properties, transitions,
    | and behaviors. This acts as the single source of truth for order workflow.
    |
    */

    'statuses' => [
        'pending' => [
            'label' => 'Pending',
            'description' => 'Order received, awaiting processing',
            'color' => 'blue',
            'icon' => 'solar:clock-circle-bold-duotone',
            'locks_pricing' => false,
            'locks_items' => false,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => false,
            'can_edit_items' => true,
            'can_edit_pricing' => true,
        ],

        'draft' => [
            'label' => 'Draft',
            'description' => 'Order is being prepared internally',
            'color' => 'gray',
            'icon' => 'solar:document-add-bold-duotone',
            'locks_pricing' => false,
            'locks_items' => false,
            'requires_note' => false,
            'visibility' => 'admin', // admin, customer, public
            'send_email' => false,
            'can_edit_items' => true,
            'can_edit_pricing' => true,
        ],
        
        'estimate_sent' => [
            'label' => 'Estimate Sent',
            'description' => 'Quotation sent to customer, awaiting response',
            'color' => 'blue',
            'icon' => 'solar:letter-opened-bold-duotone',
            'locks_pricing' => false,
            'locks_items' => false,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => true,
            'can_edit_pricing' => true, // But log changes
        ],

        'awaiting_customer_approval' => [
            'label' => 'Awaiting Customer Approval',
            'description' => 'Waiting for customer confirmation on the estimate',
            'color' => 'teal',
            'icon' => 'solar:hourglass-bold-duotone',
            'locks_pricing' => false,
            'locks_items' => false,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => true,
            'can_edit_pricing' => true,
        ],

        'pending_review' => [
            'label' => 'Pending Review',
            'description' => 'Order requires admin review before proceeding',
            'color' => 'yellow',
            'icon' => 'solar:document-text-bold-duotone',
            'locks_pricing' => false,
            'locks_items' => false,
            'requires_note' => false,
            'visibility' => 'admin',
            'send_email' => false,
            'can_edit_items' => true,
            'can_edit_pricing' => true,
        ],
        
        'customer_approved' => [
            'label' => 'Customer Approved',
            'description' => 'Customer agreed to the estimate',
            'color' => 'green',
            'icon' => 'solar:check-circle-bold-duotone',
            'locks_pricing' => true, // FREEZE PRICING HERE
            'locks_items' => false,
            'requires_note' => true,
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => true,
            'can_edit_pricing' => false,
        ],
        
        'payment_requested' => [
            'label' => 'Payment Requested',
            'description' => 'Payment link/details sent to customer',
            'color' => 'amber',
            'icon' => 'solar:wallet-money-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => false,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'requires_confirmation' => true, // Show modal before transition
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],
        
        'partially_paid' => [
            'label' => 'Partially Paid',
            'description' => 'Advance payment received',
            'color' => 'yellow',
            'icon' => 'solar:coin-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => true, // No item edits after payment
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],
        
        'paid' => [
            'label' => 'Paid / Payment Confirmed',
            'description' => 'Full payment received, order fully locked',
            'color' => 'emerald',
            'icon' => 'solar:verified-check-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => true,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'auto_lock_order' => true, // Automatically lock the entire order
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],
        
        'in_production' => [
            'label' => 'In Production',
            'description' => 'Order being printed/manufactured',
            'color' => 'purple',
            'icon' => 'solar:printer-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => true,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'create_task' => true, // Auto-create production task
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],
        
        'ready_for_delivery' => [
            'label' => 'Ready for Delivery/Pickup',
            'description' => 'Order completed and ready',
            'color' => 'cyan',
            'icon' => 'solar:box-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => true,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],
        
        'completed' => [
            'label' => 'Completed / Closed',
            'description' => 'Order delivered and closed',
            'color' => 'green',
            'icon' => 'solar:diploma-verified-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => true,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => false,
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],

        'confirmed' => [
            'label' => 'Confirmed',
            'description' => 'Order confirmed by admin (legacy status)',
            'color' => 'green',
            'icon' => 'solar:check-circle-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => false,
            'requires_note' => false,
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => true,
            'can_edit_pricing' => false,
        ],

        'returned' => [
            'label' => 'Returned',
            'description' => 'Order returned by customer',
            'color' => 'orange',
            'icon' => 'solar:undo-left-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => true,
            'requires_note' => true,
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],
        
        'on_hold' => [
            'label' => 'On Hold',
            'description' => 'Order temporarily paused',
            'color' => 'orange',
            'icon' => 'solar:pause-circle-bold-duotone',
            'locks_pricing' => false,
            'locks_items' => false,
            'requires_note' => true, // Must explain why
            'visibility' => 'admin',
            'send_email' => false,
            'can_edit_items' => true,
            'can_edit_pricing' => true,
        ],
        
        'cancelled' => [
            'label' => 'Cancelled',
            'description' => 'Order cancelled',
            'color' => 'red',
            'icon' => 'solar:close-circle-bold-duotone',
            'locks_pricing' => true,
            'locks_items' => true,
            'requires_note' => true, // Must give cancellation reason
            'requires_field' => 'cancellation_reason',
            'visibility' => 'customer',
            'send_email' => true,
            'can_edit_items' => false,
            'can_edit_pricing' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Status Transition Rules
    |--------------------------------------------------------------------------
    |
    | Define which status transitions are allowed. This prevents invalid
    | workflow transitions (e.g., paid → draft).
    |
    | Format: 'from_status' => ['allowed', 'target', 'statuses']
    |
    */

    'transitions' => [
        'pending' => [
            'draft',
            'estimate_sent',
            'pending_review',
            'awaiting_customer_approval',
            'customer_approved',
            'payment_requested',
            'on_hold',
            'cancelled',
        ],

        'draft' => [
            'estimate_sent',
            'awaiting_customer_approval',
            'cancelled',
        ],
        
        'estimate_sent' => [
            'draft', // Can go back to draft for corrections
            'awaiting_customer_approval',
            'customer_approved',
            'payment_requested', // Direct to payment if customer approves verbally
            'pending_review',
            'on_hold',
            'cancelled',
        ],

        'pending_review' => [
            'draft',
            'estimate_sent',
            'awaiting_customer_approval',
            'customer_approved',
            'payment_requested',
            'on_hold',
            'cancelled',
        ],

        'awaiting_customer_approval' => [
            'draft',
            'estimate_sent',
            'customer_approved',
            'on_hold',
            'cancelled',
        ],
        
        'customer_approved' => [
            'payment_requested',
            'on_hold',
            'cancelled',
        ],
        
        'payment_requested' => [
            'partially_paid',
            'paid',
            'on_hold',
            'cancelled',
        ],
        
        'partially_paid' => [
            'paid',
            'on_hold',
            'cancelled',
        ],
        
        'paid' => [
            'in_production',
            'on_hold', // Only for special cases
            'cancelled', // Refund scenario
        ],
        
        'in_production' => [
            'ready_for_delivery',
            'on_hold',
        ],
        
        'ready_for_delivery' => [
            'completed',
            'in_production', // If needs rework
        ],
        
        'completed' => [
            // Final state, no transitions (except admin overrides)
        ],

        'confirmed' => [
            'in_production',
            'ready_for_delivery',
            'on_hold',
            'cancelled',
        ],

        'returned' => [
            // Final state for returns
        ],
        
        'on_hold' => [
            'draft',
            'estimate_sent',
            'payment_requested',
            'in_production',
            'cancelled',
        ],
        
        'cancelled' => [
            // Final state, no transitions
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Locking Rules
    |--------------------------------------------------------------------------
    |
    | Define which statuses automatically lock orders and what can still be edited.
    |
    */

    'locking' => [
        // Statuses that lock pricing
        'pricing_locked_statuses' => [
            'payment_requested',
            'partially_paid',
            'paid',
            'in_production',
            'ready_for_delivery',
            'completed',
            'cancelled',
        ],
        
        // Statuses that lock items (no add/remove/quantity changes)
        'items_locked_statuses' => [
            'partially_paid',
            'paid',
            'in_production',
            'ready_for_delivery',
            'completed',
            'cancelled',
        ],
        
        // Statuses that fully lock the order (auto-lock)
        'fully_locked_statuses' => [
            'paid',
            'in_production',
            'ready_for_delivery',
            'completed',
        ],
        
        // What can be edited when locked
        'allowed_when_locked' => [
            'status',
            'notes',
            'shipping_method_id',
            'shipping_address_id',
            'internal_notes',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Email & Notification Rules
    |--------------------------------------------------------------------------
    |
    | Define when to send emails and what type of notification to use.
    |
    */

    'notifications' => [
        'send_email_on_statuses' => [
            'estimate_sent',
            'customer_approved',
            'payment_requested',
            'partially_paid',
            'paid',
            'in_production',
            'ready_for_delivery',
            'cancelled',
        ],
        
        'require_confirmation_before_email' => [
            'payment_requested', // Let admin review amount/message
        ],
        
        'whatsapp_template_available' => [
            'estimate_sent',
            'customer_approved',
            'payment_requested',
            'paid',
            'ready_for_delivery',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Permission Requirements
    |--------------------------------------------------------------------------
    |
    | Define which permissions are needed for certain transitions.
    |
    */

    'permissions' => [
        'unlock_order' => 'orders.unlock', // Required to unlock locked orders
        'cancel_paid_order' => 'orders.cancel_paid', // Required to cancel paid orders
        'edit_locked_pricing' => 'orders.edit_locked_pricing', // Bypass pricing lock
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Settings
    |--------------------------------------------------------------------------
    */

    'defaults' => [
        'initial_status' => 'pending',
        'payment_request_expiry_days' => 7,
        'auto_reminder_after_days' => 3,
    ],
];
