<?php
// config/pdf.php

return [

    /*
    |--------------------------------------------------------------------------
    | Storage Disk & Path
    |--------------------------------------------------------------------------
    |
    | Which filesystem disk should PDFs be written to?  (must be one of
    | disks defined in config/filesystems.php).  And under that disk,
    | what sub‐directory to use?
    |
    */
    'disk' => env('PDF_DISK', 'public'),
    'path' => env('PDF_PATH', 'estimates'),

    /*
    |--------------------------------------------------------------------------
    | Paper Size & Orientation
    |--------------------------------------------------------------------------
    |
    | Defaults for DomPDF’s paper setup.  You can override these when
    | generating per‐document if you need something other than A4/portrait.
    |
    */
    'paper_size'       => env('PDF_PAPER_SIZE', 'a4'),
    'paper_orientation'=> env('PDF_ORIENTATION', 'portrait'),

    /*
    |--------------------------------------------------------------------------
    | Page Footer Template
    |--------------------------------------------------------------------------
    |
    | If you want a consistent “Page X of Y” footer, you can point to
    | a Blade partial here.
    |
    */
    'footer_view' => 'pdfs._footer',  // e.g. resources/views/pdfs/_footer.blade.php
    'estimate' => [
      'template'    => 'pdfs.estimate',        // your Blade path
      'paper_size'  => env('PDF_PAPER_SIZE','a4'),
      'orientation' => env('PDF_ORIENTATION','portrait'),
    ],
];
