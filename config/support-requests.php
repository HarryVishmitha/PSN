<?php

return [
    'notify_email' => env('NOTIFY_EMAIL', 'printair2@gmail.com'),

    'categories' => [
        'x-banner' => [
            'label' => 'X-Banner',
        ],
        'pull-up' => [
            'label' => 'Pull-up',
        ],
        'stickers' => [
            'label' => 'Stickers',
        ],
        'business-cards' => [
            'label' => 'Business Cards',
        ],
        'other' => [
            'label' => 'Other',
        ],
    ],

    'allowed_mime_types' => [
        'image/png',
        'image/jpeg',
        'application/pdf',
        'application/postscript', // ai
        'image/vnd.adobe.photoshop', // psd
    ],

    'max_files' => 5,
    'max_file_size_mb' => 50,
];

