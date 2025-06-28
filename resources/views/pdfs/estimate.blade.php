<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ $est->estimate_number }}</title>

    <style>
        /* 1-inch margins all around */
        @page {
            margin: 1in;
        }

        /* header / footer heights */
        header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 1in;
        }

        footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1in;
            border-top: 1px solid #e2e8f0;
            font-size: 0.75rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 1rem;
            font-family: 'Be Vietnam Pro', sans-serif;
        }

        /* page-number placeholder */
        .pagenum:before {
            content: counter(page) " of " counter(pages);
        }

        /* push body content below header and above footer */
        body {
            margin: 0;
            padding-top: 1.1in;
            padding-bottom: 1.1in;
        }
    </style>
</head>

<body>

    {{-- (optional) a header region, if you want one --}}
    <header>
        <div style="text-align: center; font-weight: bold;">
            Printair Estimate
        </div>
    </header>

    <main>
        <div style="padding: 2rem 2rem 2rem 2rem; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                <!-- Left: Estimate #, Issue & Due -->
                <div style="flex: 1;">
                    <h1 style="margin: 0 0 0.25rem 0; font-weight: 700; font-size: 2.5rem; color: black;">
                        Estimate
                    </h1>
                    <div style="font-weight: 700; font-size: 1.5rem; color: black; margin-bottom: 0.25rem;">
                        #{{ $est->estimate_number}}
                    </div>
                    <p style="margin: 0.25rem 0; font-size: 0.875rem; display: flex; align-items: center;">
                        Date Issued:&nbsp;
                        <span style="font-weight: 600;">{{ \Illuminate\Support\Carbon::parse($est->valid_from)->format('Y-m-d') }}</span>
                    </p>
                    <p style="margin: 0; font-size: 0.875rem; display: flex; align-items: center;">
                        Date Due:&nbsp;
                        <span style="font-weight: 600;"> {{ \Illuminate\Support\Carbon::parse($est->valid_to)->format('Y-m-d') }}</span>
                    </p>
                </div>

                <!-- Right: Company Logo & Contact -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; text-align: right;">
                    <div>
                        <img src="/images/printairlogo.png" alt="Printair Logo" style="max-height: 95px; margin-bottom: 0.75rem;" />
                    </div>
                    <p style="margin: 0 0 0.25rem 0; font-size: 0.875rem;">
                        No. 67/D/1, Uggashena Road,<br />
                        Walpola, Ragama, Sri Lanka
                    </p>
                    <p style="margin: 0; font-size: 0.875rem;">
                        contact@printair.lk<br />
                        +94 76 886 0175
                    </p>
                </div>
            </div>
        </div>

        <!-- Body -->
        <div style="padding: 1.25rem 1.75rem;">
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 1rem;">
                <div style="flex: 1; min-width: 250px;">
                    <h6 style="font-weight: 500; font-size: 1rem; margin-bottom: 0.5rem;">Issues For:</h6>
                    <table style="font-size: 0.875rem; color: #6b7280; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0;">Name</td>
                                <td style="padding-left: 0.25rem; color: #000;">: {{ $est->customer->name }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0;">Address</td>
                                <td style="padding-left: 0.25rem; color: #000;">: {{ $est->customer->address }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0;">Phone number</td>
                                <td style="padding-left: 0.25rem; color: #000;">: {{ $est->customer->phone_number }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0;">Email</td>
                                <td style="padding-left: 0.25rem; color: #000;">: {{ $est->customer->email }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="flex: 1; min-width: 250px;">
                    <table style="font-size: 0.875rem; color: #6b7280; border-collapse: collapse; width: 100%;">
                        <tbody>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0; text-align: right; width: 120px;">Issus Date :</td>
                                <td style="padding-left: 0.25rem;">{{ \Illuminate\Support\Carbon::parse($est->valid_from)->format('Y-m-d') }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0; text-align: right;">Order ID :</td>
                                <td style="padding-left: 0.25rem;">{{ $est->estimate_number ?? 0 }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0; text-align: right;">P.O. Number :</td>
                                <td style="padding-left: 0.25rem;">{{ $est->poNumber ?? '-' }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight: 500; padding: 0.2rem 0; text-align: right;">Shipment ID :</td>
                                <td style="padding-left: 0.25rem;">{{ $est->shipment_id ?? '-' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Line Items Table -->
            <div style="margin-top: 1.5rem; overflow-x: auto; border-radius: 10px;">
                <table style="width:100%; border-collapse:collapse; font-size:0.875rem; border:1px solid #e2e8f0;">
                    <thead style="background:#ee4538; color:#fff;">
                        <tr>
                            <th style="width:3%; border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">SL.</th>
                            <th style="width:50%; border:1px solid #e2e8f0; padding:0.75rem; text-align:left;">Items</th>
                            <th style="width:3%; border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">Qty</th>
                            <th style="width:10%; border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">Units</th>
                            <th style="width:10%; border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">Unit Price</th>
                            <th style="width:10%; border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($est->items as $i => $item)

                        <tr>
                            <td style="border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">{{ $i+1 }}</td>
                            <td style="border:1px solid #e2e8f0; padding:0.75rem;">

                                <div style="font-weight:700;">{{ $item->product->name }}</div>
                                <div style="color:#6b7280; font-size:0.8rem; margin:0.25rem 0;">
                                    {{ $item->description ?? 'No description provided.' }}
                                </div>

                                {{-- if this is a roll, show size --}}
                                @if($item->is_roll)
                                <div style="font-size:0.8rem; margin-top:0.5rem;">
                                    <strong style="color:#6b7280;">Size:</strong>
                                    {{ $item->size ?? 'N/A' }}
                                </div>
                                @endif

                                {{-- base price --}}
                                <div style="font-size:0.8rem;">
                                    <strong style="color:#6b7280;">Base Price:</strong>
                                    {{ number_format($item->unit_price,2) }}
                                </div>

                                {{-- variants --}}
                                @if(! $item->is_roll && $item->variant)
                                <div style="font-size:0.8rem; margin-top:0.25rem;">
                                    <strong style="color:#6b7280;">Variants</strong>
                                    <ul style="margin:0; padding-left:1.25rem; list-style:disc;">
                                        <li>
                                            {{ $item->variant->name }}: {{ $item->variant->value }}
                                            @if($item->subvariant)
                                            <ul style="margin:0; padding-left:1.25rem; list-style:disc;">
                                                <li>{{ $item->subvariant->name }}: {{ $item->subvariant->value }}</li>
                                            </ul>
                                            @endif
                                        </li>
                                    </ul>
                                </div>
                                @endif

                            </td>
                            <td style="border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">
                                {{ $item->quantity }}
                            </td>
                            <td style="border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">
                                {{ $item->unit }}
                            </td>
                            <td style="border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">
                                {{ number_format($item->unit_price,2) }}
                            </td>
                            <td style="border:1px solid #e2e8f0; padding:0.75rem; text-align:center;">
                                {{ number_format($item->line_total,2) }}
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Footer Message -->
        <div style="margin-top: 4rem;">
            <p style="text-align: center; font-weight: 600; font-size: 0.875rem; color: #6b7280; margin: 0;">
                Looking forward to work with you!
            </p>
        </div>

        <!-- Footer Bottom -->
        <!-- @include('pdfs._footer') -->
    </main>

    <footer>
        <span>System Authorized.</span>
        <span class="pagenum"></span>
        <span>www.printair.lk</span>
    </footer>

</body>

</html>