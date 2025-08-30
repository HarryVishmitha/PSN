@php
// Helper formatters (you can move these to a dedicated helper)
$money = fn($n) => 'LKR '.number_format((float)($n ?? 0), 2);
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
$discountAmt = $discountMode === 'percent' ? ($subtotal * min(100,max(0,$discountVal)) / 100.0) : ($discountMode === 'fixed' ? $discountVal : 0);

$taxMode = $estimate->tax_mode ?? 'none';
$taxVal = (float)($estimate->tax_value ?? 0);
$taxBase = max(0, $subtotal - $discountAmt);
$taxAmt = $taxMode === 'percent' ? ($taxBase * min(100,max(0,$taxVal)) / 100.0) : ($taxMode === 'fixed' ? $taxVal : 0);

$shipping = (float)($estimate->shipping ?? 0);
$grand = max(0, $taxBase + $taxAmt + $shipping);

// Optional QR code (base64 PNG). Provide $qrPng if you have one.
// $qrPng = 'data:image/png;base64,'.base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')->size(100)->generate(route('estimates.show', $estimate->id)));

$logoPath = public_path('assets/images/logo-full.png');
$logoUrl = 'file:///' . str_replace('\\', '/', $logoPath); // or use base64 if you prefer

@endphp
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Quotation - {{ $meta->number }}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
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
            margin: 10mm 8mm 12mm 8mm;
        }

        body {
            font-family: 'Be Vietnam Pro', sans-serif;
            color: var(--ink);
            font-size: 11.5px;
            line-height: 1.45;
        }

        /* fixed header adjusted for the tighter margins */
        header {
            position: fixed;
            top: -6mm;
            left: 0;
            right: 0;
            height: 34mm;
        }

        .hf-wrap {
            padding: 8mm 8mm 0 8mm;
        }

        /* center header using a single-cell table (Dompdf friendly) */
        .center-table {
            width: 100%;
            border-collapse: collapse;
        }

        .center-table td {
            text-align: center;
            vertical-align: top;
        }

        .logo {
            width: 150px;
            height: auto;
            border: 0;
        }

        .company {
            margin-top: 2px;
        }

        .company h1 {
            margin: 0 0 2px 0;
            font-size: 16px;
            color: var(--accent);
        }

        .company div {
            color: var(--gray);
        }

        /* title bar stays full width */
        .titlebar {
            margin-top: 8px;
            background: var(--brand);
            color: #fff;
            padding: 8px 12px;
            border-radius: 8px;
        }

        .title-left {
            display: inline-block;
            font-weight: 800;
            font-size: 18px;
            letter-spacing: .8px;
        }

        .title-right {
            float: right;
            font-size: 10px;
            padding: 3px 8px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, .45);
            background: rgba(255, 255, 255, .18);
        }

        /* push body below header */
        main {
            margin-top: 38mm;
        }
    </style>



</head>

<body>

    <header>
        <div class="hf-wrap">
            <table class="center-table">
                <tr>
                    <td>
                        @if(!empty($logoPath))
                        <img class="logo" src="{{ $logoPath }}" alt="Logo">
                        @else
                        <div style="font-weight:900;font-size:22px;color:var(--brand)">PRINTAIR</div>
                        @endif

                        <div class="company">
                            <h1>Printair Advertising</h1>
                            <div>No. 67/D/1, Uggashena Road, Walpola, Ragama, Sri Lanka.</div>
                            <div>+94 76 886 0175 | contact@printair.lk | printair.lk</div>
                        </div>
                    </td>
                </tr>
            </table>

            <div class="titlebar">
                <div class="title-left">QUOTATION</div>
                <div class="title-right">{{ isset($meta->number) ? strtoupper($meta->number) : 'Error' }}</div>
                <div style="clear:both;"></div>
            </div>
        </div>
    </header>


</body>

</html>
