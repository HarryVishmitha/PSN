<?php
// Helper formatters (you can move these to a dedicated helper)
$money = fn($n) => 'LKR ' . number_format((float)($n ?? 0), 2);
$isDraft = isset($estimate->status) && strtolower($estimate->status) === 'draft';

// Fallbacks
$company = $company ?? (object)[
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
    'sales' => $userDetails->name ?? '—',
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
$subtotal = collect($estimate->items ?? [])->sum(fn($i) => (float)$i['qty'] * (float)$i['unit_price']);
$discountMode = $estimate->discount_mode ?? 'none';
$discountVal = (float)($estimate->discount_value ?? 0);
$discountAmt = $discountMode === 'percent' ? ($subtotal * min(100, max(0, $discountVal)) / 100.0) : ($discountMode === 'fixed' ? $discountVal : 0);

$taxMode = $estimate->tax_mode ?? 'none';
$taxVal = (float)($estimate->tax_value ?? 0);
$taxBase = max(0, $subtotal - $discountAmt);
$taxAmt = $taxMode === 'percent' ? ($taxBase * min(100, max(0, $taxVal)) / 100.0) : ($taxMode === 'fixed' ? $taxVal : 0);

$shipping = (float)($estimate->shipping ?? 0);
$grand = max(0, $taxBase + $taxAmt + $shipping);

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
        $__sales = $meta->sales ?? ($userDetails->name ?? '—');
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
                            <div class="meta-value">{{ $__sales }}</div>
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
                    $qty = (float)($it['qty'] ?? 0);
                    $uprice= (float)($it['unit_price'] ?? 0);
                    $line = $qty * $uprice;
                    $isRoll= !empty($it['is_roll']);
                    $name = $it['product_name'] ?? $it['description'] ?? 'Item';
                    @endphp
                    <tr>
                        <td>{{ $i+1 }}</td>
                        <td>
                            <div style="font-weight:600">{{ $name }}</div>

                            {{-- extra info --}}
                            <div class="small-muted" style="margin-top:2px;">
                                @if($isRoll)
                                @php
                                $w = $it['cut_width_in'] ?? null;
                                $h = $it['cut_height_in'] ?? null;
                                $size = $it['size'] ?? (($w && $h) ? ($w.'" × '.$h.'"') : null);
                                @endphp
                                @if($size) Size: {{ $size }} @endif
                                @if(!empty($it['offcut_price_per_sqft'])) • Offcut: {{ $money($it['offcut_price_per_sqft']) }}/ft² @endif
                                @else
                                Base: {{ number_format((float)($it['base_price'] ?? 0), 2) }}
                                @endif
                            </div>

                            {{-- variants as small badges --}}
                            @if(!empty($it['variants']) && is_iterable($it['variants']))
                            <div style="margin-top:2px;">
                                @foreach($it['variants'] as $v)
                                <span class="badge">{{ $v['variant_name'] ?? 'Var' }}: {{ $v['variant_value'] ?? '' }}</span>
                                @if(!empty($v['subvariants']))
                                @foreach($v['subvariants'] as $sv)
                                <span class="badge">{{ $sv['subvariant_name'] ?? 'Sub' }}: {{ $sv['subvariant_value'] ?? '' }}</span>
                                @endforeach
                                @endif
                                @endforeach
                            </div>
                            @endif

                            {{-- free text desc --}}
                            @if(!empty($it['description']))
                            <div class="small-muted" style="margin-top:2px;">{{ $it['description'] }}</div>
                            @endif
                        </td>

                        <td class="text-right">{{ rtrim(rtrim(number_format($qty,2), '0'), '.') }}</td>
                        <td>{{ $it['unit'] ?? '—' }}</td>
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
                                    <li>Delivery available; shipping charges may apply.</li>
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
                <h3>Payment Method — Bank Transfer</h3>
                <table class="kv-table" style="margin-top:4px;">
                    <tr>
                        <td class="kv-k" style="width:140px;">Bank Name</td>
                        <td>Commercial Bank of Ceylon PLC</td>
                    </tr>
                    <tr>
                        <td class="kv-k">Branch</td>
                        <td>Kadawatha Branch</td>
                    </tr>
                    <tr>
                        <td class="kv-k">Account Name</td>
                        <td>Printair Advertising</td>
                    </tr>
                    <tr>
                        <td class="kv-k">Account Number</td>
                        <td>123456789012</td>
                    </tr>
                    <tr>
                        <td class="kv-k">SWIFT Code</td>
                        <td>CCBL-LKLX</td>
                    </tr>
                </table>

                <div class="small-muted" style="margin-top:10px;">
                    <strong>Note:</strong> After transferring, please send the receipt to <span style="color:var(--brand); font-weight:500;">finance@printair.lk</span> or WhatsApp <strong>+94 76 886 0175</strong> for order processing.
                </div>
            </div>
        </section>

    </main>

</body>

</html>
