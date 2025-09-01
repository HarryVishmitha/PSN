<?php
// Helper formatters (you can move these to a dedicated helper)
$money = fn($n) => 'LKR ' . number_format((float)($n ?? 0), 2);
$isDraft = isset($estimate->status) && strtolower($estimate->status) === 'draft';

// Fallbacks
// Fallbacks
$company = (object)[
    'name' => 'Printair Advertising',
    'address' => 'No. 67/D/1, Uggashena Road, Walpola, Ragama, Sri Lanka.',
    'phone' => '+94 76 886 0175',
    'email' => 'contact@printair.lk',
    'website' => 'www.printair.lk',
];


$meta = (object)[
    'number' => $estimate->estimate_number ?? 'EST-YYYYMMDD-0001',
    'issue' => \Illuminate\Support\Str::of($estimate->issue_date ?? now()->toDateString())->toString(),
    'due' => \Illuminate\Support\Str::of($estimate->due_date ?? now()->addDays(14)->toDateString())->toString(),
    'sales' => $estimate->creator->name ?? '—',
    'po' => $estimate->po_number ?? null,
];

$client = (object)[
    'name' => $estimate->client_name ?? $estimate->customer->name ?? '—',
    'address' => $estimate->client_address ?? $estimate->customer->billing_address ?? '—',
    'email' => $estimate->client_email ?? $estimate->customer->email ?? '—',
    'phone' => $estimate->client_phone ?? $estimate->customer->phone ?? '—',
    'type' => $estimate->client_type ?? 'Customer',
];

// Totals (use your backend-calculated values if provided)
$subtotal     = (float)($estimate->subtotal_amount ?? 0);
$discountMode = $estimate->discount_mode ?? 'none';
$discountVal  = (float)($estimate->discount_value ?? 0);
$discountAmt  = (float)($estimate->discount_amount ?? 0);

$taxMode      = $estimate->tax_mode ?? 'none';
$taxVal       = (float)($estimate->tax_value ?? 0);
$taxAmt       = (float)($estimate->tax_amount ?? 0);

$shipping     = (float)($estimate->shipping_amount ?? 0);
$grand        = (float)($estimate->total_amount ?? max(0, $subtotal - $discountAmt + $taxAmt + $shipping));


// Optional QR code (base64 PNG). Provide $qrPng if you have one.
// $qrPng = 'data:image/png;base64,'.base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')->size(100)->generate(route('estimates.show', $estimate->id)));

$logoPath = public_path('assets/images/logo-full.png');
$logoUrl = 'file:///' . str_replace('\\', '/', $logoPath); // or use base64 if you prefer

?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Quotation - {{ $meta->number }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        @font-face {
            font-family: 'Be Vietnam Pro';
            font-style: normal;
            font-weight: 400;
            src: url("{{ public_path(' fonts/BeVietnamPro-Regular.ttf') }}") format('truetype');
        }

        @font-face {
            font-family: 'Be Vietnam Pro';
            font-style: normal;
            font-weight: 600;
            src: url("{{ public_path(' fonts/BeVietnamPro-Medium.ttf') }}") format('truetype');
        }

        @font-face {
            font-family: 'Be Vietnam Pro';
            font-style: normal;
            font-weight: 800;
            src: url("{{ public_path(' fonts/BeVietnamPro-Bold.ttf') }}") format('truetype');
        }

        :root {
            --brand: #f44032;
            --ink: #0f172a;
            --gray: #6b7280;
            --line: #e5e7eb;
            --soft: #f9fafb;
            --accent: #111827;
        }

        /* tighter page margins */
        @page {
            size: A4;
            margin: 10mm 8mm 8mm 8mm;
        }

        body {
            /* Dompdf-safe fallback */
            font-family: 'Be Vietnam Pro', sans-serif;
            color: var(--ink);
            font-size: 11.5px;
            line-height: 1.45;
        }

        /* === fixed header: ONLY the title bar (repeats every page) === */
        header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 18mm;
            z-index: 20;
        }

        .titlebar {
            margin: 0;
            background: var(--brand);
            color: #fff;
            padding: 8px 12px;
            border-radius: 0;
        }

        .titlebar-table {
            width: 100%;
            border-collapse: collapse;
        }

        .title-left {
            font-weight: 800;
            font-size: 18px;
            letter-spacing: .8px;
            color: #fff;
        }

        .title-chip {
            display: inline-block;
            font-size: 10px;
            padding: 3px 8px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, .45);
            background: rgba(255, 255, 255, .18);
            color: #fff;
        }

        /* fixed footer (repeats on ALL pages) */
        footer {
            position: fixed;
            bottom: 3mm;
            /* lower than before */
            left: 0;
            right: 0;
            height: 12mm;
            font-size: 10px;
            color: var(--gray);
            z-index: 20;
            text-align: center;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            padding: 0 8mm;
            vertical-align: middle;
        }

        .footer-table .left {
            text-align: center;
            font-weight: 600;
            color: var(--brand);
        }

        .footer-table .center {
            text-align: center;
            font-style: italic;
        }

        .footer-table .right {
            text-align: center;
            font-weight: 600;
        }

        /* === content leaves room for header & footer === */
        main {
            margin-top: 22mm;
            margin-bottom: 20mm;
        }

        /* 18mm+gap, 12mm+gap */

        /* Page-1 masthead (logo/company) */
        .masthead {
            padding: 0 8mm 4mm 8mm;
            text-align: center;
        }

        .masthead .logo {
            width: 150px;
            height: auto;
            border: 0;
        }

        .masthead .company {
            margin-top: 2px;
        }

        .masthead .company h1 {
            margin: 0 0 2px 0;
            font-size: 16px;
            color: var(--accent);
        }

        .masthead .company div {
            color: var(--gray);
        }

        /* break control helpers */
        .avoid-break {
            page-break-inside: avoid;
        }

        .page-break-before {
            page-break-before: always;
        }

        /* (keep your existing table styles as-is) */

        /* push body below header */
        main {
            margin-top: 20mm;
            margin-bottom: 20mm;
        }

        /* meta summary as a 4-col table */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .meta-table td {
            width: 25%;
            padding: 0 8px 0 0;
            vertical-align: top;
        }

        .meta-table td:last-child {
            padding-right: 0;
        }

        .meta-box {
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 8px 10px;
        }

        .meta-label {
            color: var(--gray);
            font-size: 10px;
            margin-bottom: 2px;
        }

        .meta-value {
            font-weight: 700;
            letter-spacing: .2px;
        }

        .meta-po {
            color: var(--gray);
            font-size: 10px;
            margin-top: 3px;
        }

        /* sections & cards */
        .section {
            margin-top: 10px;
        }

        .card {
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 10px 12px;
            background: #fff;
        }

        .card h3 {
            margin: 0 0 6px 0;
            font-size: 12.5px;
            color: var(--accent);
        }

        /* bill-to (table) */
        .billto-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .billto-table td {
            vertical-align: top;
        }

        .kv-table {
            width: 100%;
            border-collapse: collapse;
        }

        .kv-table td {
            padding: 4px 0;
        }

        .kv-k {
            color: var(--gray);
            width: 110px;
        }

        .muted {
            color: var(--gray);
            font-size: 10px;
        }

        /* Keep table headers together across pages */
        thead {
            display: table-header-group;
        }

        tfoot {
            display: table-row-group;
        }

        tr {
            page-break-inside: avoid;
        }

        /* ===== Items table ===== */
        table.items {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 10px;
        }

        .items thead th {
            text-align: left;
            font-size: 11px;
            color: #111827;
            background: var(--soft);
            border-top: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
            padding: 8px;
        }

        .items thead th:first-child {
            border-top-left-radius: 8px;
        }

        .items thead th:last-child {
            border-top-right-radius: 8px;
        }

        .items tbody td {
            border-bottom: 1px solid var(--line);
            padding: 8px;
            vertical-align: top;
        }

        .items tbody tr:nth-child(even) td {
            background: #fafafa;
        }

        .text-right {
            text-align: right;
        }

        .small-muted {
            color: var(--gray);
            font-size: 10px;
        }

        .badge {
            display: inline-block;
            font-size: 9.5px;
            padding: 2px 6px;
            border-radius: 10px;
            background: #eef2ff;
            color: #3730a3;
            border: 1px solid #e0e7ff;
            margin-right: 4px;
            margin-top: 2px;
        }

        /* ===== Totals / Terms ===== */
        .totals-wrap {
            margin-top: 10px;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            vertical-align: top;
        }

        .sum-card {
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 8px 10px;
        }

        .sum-card table {
            width: 100%;
            border-collapse: collapse;
        }

        .sum-card td {
            padding: 6px 0;
        }

        .sum-card tr td:first-child {
            color: var(--gray);
        }

        .sum-card .grand td {
            border-top: 1px dashed var(--line);
            padding-top: 10px;
            font-weight: 800;
            font-size: 13px;
            color: #111827;
        }

        .note-card {
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 10px 12px;
        }

        .note-card h3 {
            margin: 0 0 6px 0;
            font-size: 12.5px;
            color: var(--accent);
        }

        .card h3 {
            margin: 0 0 6px 0;
            font-size: 12.5px;
            color: var(--accent);
        }

        footer {
            position: fixed;
            bottom: 8mm;
            left: 0;
            right: 0;
            height: 12mm;
            font-size: 10px;
            color: var(--gray);
            z-index: 10;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            padding: 0 8mm;
            vertical-align: middle;
        }

        .footer-table .left {
            text-align: left;
            font-weight: 500;
            color: var(--brand);
        }

        .footer-table .center {
            text-align: center;
            font-style: italic;
        }

        .footer-table .right {
            text-align: right;
            font-weight: 500;
        }

        .mt-312as {
            margin-top: 20mm;
        }
    </style>



</head>

<body>

    <header>
        <div class="titlebar">
            <table class="titlebar-table">
                <tr>
                    <td class="title-left">QUOTATION</td>
                    <td style="text-align:right;">
                        <span class="title-chip">{{ $meta->number }}</span>
                    </td>
                </tr>
            </table>
        </div>
    </header>


    <main>
        <!-- Page 1 masthead (not fixed) -->
        <div class="masthead avoid-break">
            @php
            $logoData = null;
            if (is_file($logoPath)) {
            $logoData = 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath));
            }
            @endphp

            @if($logoData)
            <img class="logo" src="{{ $logoData }}" alt="Logo">
            @else
            <div style="font-weight:900;font-size:22px;color:var(--brand)">PRINTAIR</div>
            @endif


            <div class="company">
                <h1>{{ $company->name }}</h1>
                <div>{{ $company->address }}</div>
                <div>{{ $company->phone }} | {{ $company->email }} | {{ $company->website }}</div>
            </div>
        </div>

        @php
        use Carbon\Carbon;
        $__num = $meta->number ?? ($estimate->estimate_number ?? '—');
        $__issue = $meta->issue ?? ($estimate->issue_date ?? now()->toDateString());
        $__due = $meta->due ?? ($estimate->due_date ?? now()->addDays(14)->toDateString());
        $__sales = $meta->sales ?? ($estimate->creator->name ?? '—');
        $__po = $meta->po ?? ($estimate->po_number ?? null);

        $clientObj = isset($client) ? $client : (object)[
        'name' => $estimate->client_name ?? ($estimate->customer->name ?? '—'),
        'phone' => $estimate->client_phone ?? ($estimate->customer->phone ?? '—'),
        'email' => $estimate->client_email ?? ($estimate->customer->email ?? '—'),
        'address' => $estimate->client_address ?? ($estimate->customer->billing_address ?? '—'),
        'type' => $estimate->client_type ?? 'Customer',
        ];
        @endphp

        <!-- Meta Summary -->
        <section class="section">
            <table class="meta-table">
                <tr>
                    <td>
                        <div class="meta-box">
                            <div class="meta-label">Estimate No.</div>
                            <div class="meta-value">{{ $__num }}</div>
                            @if($__po)<div class="meta-po">PO: {{ $__po }}</div>@endif
                        </div>
                    </td>
                    <td>
                        <div class="meta-box">
                            <div class="meta-label">Issued</div>
                            <div class="meta-value">{{ Carbon::parse($__issue)->format('Y-m-d') }}</div>
                        </div>
                    </td>
                    <td>
                        <div class="meta-box">
                            <div class="meta-label">Valid Until</div>
                            <div class="meta-value">{{ Carbon::parse($__due)->format('Y-m-d') }}</div>
                        </div>
                    </td>
                    <td>
                        <div class="meta-box">
                            <div class="meta-label">Sales Rep</div>
                            <div class="meta-value">{{ $estimate->creator->name ?? '—' }}</div>
                        </div>
                    </td>
                </tr>
            </table>
        </section>

        <!-- Bill To + (optional) Notes -->
        <section class="section">
            <table class="billto-table">
                @php $hasNotes = !empty($estimate->notes); @endphp
                <tr>
                    <td @if(!$hasNotes) colspan="2" @endif style="width:62%; padding-right:8px;">
                        <div class="card">
                            <h3>Bill To</h3>
                            <table class="kv-table">
                                <tr>
                                    <td class="kv-k">Name</td>
                                    <td><strong>{{ $clientObj->name }}</strong></td>
                                </tr>
                                <tr>
                                    <td class="kv-k">Phone</td>
                                    <td>{{ $clientObj->phone }}</td>
                                </tr>
                                <tr>
                                    <td class="kv-k">Email</td>
                                    <td>{{ $clientObj->email }}</td>
                                </tr>
                                <tr>
                                    <td class="kv-k">Address</td>
                                    <td>{{ $clientObj->address }}</td>
                                </tr>
                            </table>
                        </div>
                    </td>

                    @if($hasNotes)
                    <td style="width:38%; padding-left:8px;">
                        <div class="card">
                            <h3>Internal Notes</h3>
                            <div class="muted">{!! nl2br(e($estimate->notes)) !!}</div>
                        </div>
                    </td>
                    @endif
                </tr>
            </table>
        </section>

        <!-- ===== Line Items ===== -->
        <section class="section avoid-break">
            <table class="items">
                <thead>
                    <tr>
                        <th style="width:26px;">#</th>
                        <th>Item / Description</th>
                        <th style="width:70px;" class="text-right">Qty</th>
                        <th style="width:70px;">Unit</th>
                        <th style="width:100px;" class="text-right">Unit Price</th>
                        <th style="width:110px;" class="text-right">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse(($estimate->items ?? []) as $i => $it)
                    @php
                    // $it is an Eloquent model (EstimateItem)
                    $qty = (float)($it->quantity ?? 0);
                    $uprice = (float)($it->unit_price ?? 0);
                    $line = (float)($it->line_total ?? ($qty * $uprice));
                    $isRoll = (bool)($it->is_roll ?? false);
                    $name = $it->product->name ?? $it->description ?? 'Item';
                    @endphp
                    <tr>
                        <td>{{ $i+1 }}</td>
                        <td>
                            <div style="font-weight:600">{{ $name }}</div>

                            <div class="small-muted" style="margin-top:2px;">
                                @if($isRoll)
                                @php
                                $w = $it->cut_width_in ?? null;
                                $h = $it->cut_height_in ?? null;
                                $size = ($w && $h) ? (number_format($w,2).'" × '.number_format($h,2).'"') : null;
                                @endphp
                                @if($size) Size: {{ $size }} @endif
                                @if(!is_null($it->offcut_price_per_sqft))
                                • Offcut: {{ $money($it->offcut_price_per_sqft) }}/ft²
                                @endif
                                @endif
                            </div>

                            @if(!empty($it->description))
                            <div class="small-muted" style="margin-top:2px;">{{ $it->description }}</div>
                            @endif
                        </td>

                        <td class="text-right">{{ number_format($qty, 2) }}</td>
                        <td>{{ $it->unit ?? '—' }}</td>
                        <td class="text-right">{{ $money($uprice) }}</td>
                        <td class="text-right">{{ $money($line) }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="6" class="small-muted">No items.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </section>

        <!-- ===== Totals + Terms ===== -->
        <section class="section totals-wrap avoid-break">
            <table class="totals-table">
                <tr>
                    <!-- Terms / notes (left) -->
                    <td style="width:60%; padding-right:8px;">
                        <div class="note-card">
                            <h3>Terms &amp; Notes</h3>
                            <div class="small-muted">
                                <ul style="margin:6px 0 0 16px; padding:0;">
                                    <li>Prices are in LKR and valid until {{ \Carbon\Carbon::parse($meta->due)->format('Y-m-d') }}.</li>
                                    <li>Lead time: 2–5 business days after confirmation &amp; payment.</li>
                                    <li>Color variance ±5% may occur due to print profiles.</li>
                                    <li>All sales are final; no refunds or exchanges. (Because products are customized.)</li>
                                    <li>The final decision of considering refunds or exchanges are in the company owner or the manager.</li>
                                    <li>Product images are for illustrative purposes only and may differ from the actual product.</li>
                                    <li>To start the printing process you need to pay at least 60% of the total amount. (Or the amount that admins or company personals asks.)</li>
                                    <li>Delivery available; shipping charges may apply.</li>
                                    <li>Other company policies or T&C may applied.</li>
                                    <li>Please contact us for any inquiries or clarifications.</li>
                                </ul>
                            </div>
                        </div>
                    </td>

                    <!-- Sum (right) -->
                    <td style="width:40%; padding-left:8px;">
                        <div class="sum-card">
                            <table>
                                <tr>
                                    <td>Subtotal</td>
                                    <td class="text-right">{{ $money($subtotal) }}</td>
                                </tr>
                                <tr>
                                    <td>
                                        Discount
                                        @if($discountMode === 'percent') ({{ rtrim(rtrim(number_format($discountVal,2),'0'),'.') }}%)
                                        @elseif($discountMode === 'fixed') (Fixed) @endif
                                    </td>
                                    <td class="text-right">– {{ $money($discountAmt) }}</td>
                                </tr>
                                <tr>
                                    <td>
                                        Tax
                                        @if($taxMode === 'percent') ({{ rtrim(rtrim(number_format($taxVal,2),'0'),'.') }}%)
                                        @elseif($taxMode === 'fixed') (Fixed) @endif
                                    </td>
                                    <td class="text-right">{{ $money($taxAmt) }}</td>
                                </tr>
                                <tr>
                                    <td>Shipping</td>
                                    <td class="text-right">{{ $money($shipping) }}</td>
                                </tr>
                                <tr class="grand">
                                    <td>Total</td>
                                    <td class="text-right">{{ $money($grand) }}</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>
        </section>

        <!-- ===== Payment Methods ===== -->
        <section class="section page-break-before">
            <div class="card mt-312as">
                @if(isset($payments) && count($payments))
                <div style="margin-top: 18px;">
                    <h4 style="margin-bottom: 8px;">Payment Methods</h4>
                    @foreach($payments as $pm)
                    <div style="margin-bottom: 10px;">
                        <strong>{{ $pm['display_name'] }}</strong><br>

                        @if($pm['bank_name'] || $pm['account_name'] || $pm['account_number'])
                        <div>
                            <div><strong>Bank:</strong> {{ $pm['bank_name'] ?? '—' }}</div>
                            <div><strong>Branch:</strong> {{ $pm['branch'] ?? '—' }}</div>
                            <div><strong>Account Name:</strong> {{ $pm['account_name'] ?? '—' }}</div>
                            <div><strong>Account Number:</strong> {{ $pm['account_number'] ?? '—' }}</div>
                            <div><strong>SWIFT Code:</strong> {{ $pm['swift'] ?? '—' }}</div>
                        </div>
                        @endif

                        @if(!empty($pm['instructions']))
                        <div style="margin-top: 4px;">{!! nl2br(e($pm['instructions'])) !!}</div>
                        @endif

                    </div>
                    @endforeach
                    <div style="margin-top: 0px;">
                        <!-- Payment Confirmation (drop-in block) -->
                        <div style="margin-top:12px; border:1px solid #e5e7eb; border-radius:8px; background:#fff; padding:10px 12px;">
                            <h3 style="margin:0 0 6px 0; font-size:12.5px; color:#111827;">Payment Confirmation</h3>
                            <p style="margin:4px 0 8px 0; color:#374151; line-height:1.45;">
                                After you make the transfer, please share your <strong>payment receipt</strong> so we can confirm your order and start production promptly.
                            </p>

                            <table style="width:100%; border-collapse:collapse; font-size:11.5px;">
                                <tr>
                                    <td style="width:110px; color:#6b7280; padding:2px 0;">Email</td>
                                    <td style="padding:2px 0;">
                                        <a href="mailto:contact@printair.lk" style="color:#111827; text-decoration:none;">contact@printair.lk</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color:#6b7280; padding:2px 0;">WhatsApp</td>
                                    <td style="padding:2px 0;">
                                        <a href="https://wa.me/94768860175" style="color:#111827; text-decoration:none;">+94 76 886 0175</a>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-top:8px; color:#6b7280; font-size:10.5px;">
                                <div>Tips for faster processing:</div>
                                <ul style="margin:6px 0 0 16px; padding:0;">
                                    <li>Please include your <strong>Estimate No.</strong> (e.g., {{ $estimate->estimate_number ?? 'EST-XXXX' }}) in the message.</li>
                                    <li>Attach a clear <strong>photo/PDF</strong> of the receipt (ensure the reference number is visible).</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
                @endif

            </div>
        </section>

    </main>
    {{-- Dompdf page numbers + footer text --}}
    <script type="text/php">
        if (isset($pdf)) {
    // Margins (in points; Dompdf uses 72 pt/inch)
    $marginX = 28; // ~10mm
    $y = $pdf->get_height() - 24; // a bit above bottom edge

    // Texts
    $leftText   = "printair.lk";
    $centerText = "Page {PAGE_NUM} of {PAGE_COUNT}";
    $rightText  = "System Authorized";

    // Font & size (fallback to Helvetica if custom font missing)
    $font = $fontMetrics->getFont('Be Vietnam Pro', 'normal');
    if (!$font) { $font = $fontMetrics->getFont('helvetica', 'normal'); }
    $size = 9;

    // Colors (black)
    $color = [0,0,0];

    // Canvas width
    $w = $pdf->get_width();

    // Measure widths
    $leftW   = $fontMetrics->getTextWidth($leftText,   $font, $size);
    $centerW = $fontMetrics->getTextWidth($centerText, $font, $size);
    $rightW  = $fontMetrics->getTextWidth($rightText,  $font, $size);

    // X positions
    $leftX   = $marginX;
    $centerX = ($w - $centerW) / 2;
    $rightX  = $w - $marginX - $rightW;

    // Draw
    $pdf->page_text($leftX,   $y, $leftText,   $font, $size, $color);
    $pdf->page_text($centerX, $y, $centerText, $font, $size, $color);
    $pdf->page_text($rightX,  $y, $rightText,  $font, $size, $color);
}
</script>

</body>

</html>