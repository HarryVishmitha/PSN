{{-- Variables passed from QuotationPublished Mailable: $estimate, $viewUrl, $downloadUrl, $companyPhone --}}

<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
  <meta charset="UTF-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>Quotation {{ $estimate->estimate_number }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Reset-ish */
    html,body{margin:0!important;padding:0!important;background:#f6f7fb;font-family:'Be Vietnam Pro',sans-serif;}
    img{border:0;outline:none;text-decoration:none;display:block;max-width:100%;line-height:100%;}
    table{border-collapse:collapse!important;border-spacing:0!important;}
    .btn{background:#f44032;color:#ffffff;text-decoration:none;display:inline-block;padding:12px 18px;border-radius:8px;font-weight:600;transition:all 0.2s ease;}
    .btn:hover{background:#e53935;}
    .btn-secondary{background:#0ea5e9;color:#ffffff;text-decoration:none;display:inline-block;padding:12px 18px;border-radius:8px;font-weight:600;transition:all 0.2s ease;}
    .btn-secondary:hover{background:#0288d1;}
    .muted{color:#6b7280;font-size:12px}
    .highlight{color:#f44032;}
    @media (max-width:600px){
      .container{width:100%!important}
      .px{padding-left:16px!important;padding-right:16px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:'Be Vietnam Pro',sans-serif;">
  <!-- PREVIEW TEXT (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your quotation {{ $estimate->estimate_number }} from Printair is ready. View, download, or contact us for changes.
  </div>

  <table role="presentation" width="100%" bgcolor="#f6f7fb">
    <tr>
      <td align="center" style="padding:24px;">
        <table class="container" role="presentation" width="640" style="width:640px;max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td class="px" style="padding:20px 28px;background:#111827;">
              <table width="100%">
                <tr>
                  <td align="left">
                    <img src="{{ asset('images/printairlogo.png') }}" width="160" alt="Printair Advertising" />
                  </td>
                  <td align="right" style="text-align:right;color:#fff;">
                    <div style="font-size:12px;opacity:0.8;">Quotation</div>
                    <div style="font-size:16px;font-weight:700;">{{ $estimate->estimate_number }}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="px" style="padding:32px 28px 20px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.3;color:#111827;font-weight:700;">
                Your quotation is ready <span style="color:#f44032;">🎉</span>
              </h1>
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">
                Hi {{ $estimate->client_name ?? 'there' }},<br/>
                We've prepared your quotation for your project with Printair. Please review the details below and feel free to reach out if you need any adjustments or have questions.
              </p>
            </td>
          </tr>

          <!-- Summary Cards -->
          <tr>
            <td class="px" style="padding:0 28px 24px;">
              <table role="presentation" width="100%" style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td width="33%" style="padding-right:10px;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Issued</div>
                          <div style="font-weight:600;color:#111827;font-size:15px;">{{ \Illuminate\Support\Carbon::parse($estimate->issue_date)->toFormattedDateString() }}</div>
                        </td>
                        <td width="33%" style="padding-right:10px;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Due</div>
                          <div style="font-weight:600;color:#111827;font-size:15px;">{{ \Illuminate\Support\Carbon::parse($estimate->due_date)->toFormattedDateString() }}</div>
                        </td>
                        <td width="34%">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Total</div>
                          <div style="font-weight:700;color:#f44032;font-size:16px;">LKR {{ number_format($estimate->total_amount ?? 0, 2) }}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          @if(!empty($estimate->items))
          <tr>
            <td class="px" style="padding:0 28px 24px;">
              <table role="presentation" width="100%" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <thead>
                  <tr style="background:linear-gradient(135deg, #111827 0%, #1f2937 100%);color:#ffffff;">
                    <th align="left" style="padding:14px 16px;font-size:13px;font-weight:600;letter-spacing:0.3px;">Item</th>
                    <th align="center" style="padding:14px 16px;font-size:13px;font-weight:600;letter-spacing:0.3px;">Qty</th>
                    <th align="right" style="padding:14px 16px;font-size:13px;font-weight:600;letter-spacing:0.3px;">Unit</th>
                    <th align="right" style="padding:14px 16px;font-size:13px;font-weight:600;letter-spacing:0.3px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @foreach($estimate->items as $item)
                  <tr style="transition: background-color 0.2s ease;">
                    <td style="padding:14px 16px;border-top:1px solid #e5e7eb;background-color:#ffffff;">
                      <div style="font-weight:600;color:#111827;font-size:14px;">{{ $item->product->name ?? 'Item' }}</div>
                      @if(!empty($item->description))
                        <div style="color:#6b7280;font-size:13px;margin-top:3px;">{{ $item->description }}</div>
                      @endif
                      @if($item->is_roll && $item->cut_width_in && $item->cut_height_in)
                        <div style="color:#6b7280;font-size:13px;margin-top:3px;">Size: {{ $item->cut_width_in }}" × {{ $item->cut_height_in }}"</div>
                      @endif
                    </td>
                    <td align="center" style="padding:14px 16px;border-top:1px solid #e5e7eb;color:#111827;background-color:#ffffff;font-size:14px;">
                      {{ (int)($item->quantity ?? 1) }}
                    </td>
                    <td align="right" style="padding:14px 16px;border-top:1px solid #e5e7eb;color:#111827;background-color:#ffffff;font-size:14px;">
                      {{ $item->unit ?? '-' }}
                    </td>
                    <td align="right" style="padding:14px 16px;border-top:1px solid #e5e7eb;color:#111827;background-color:#ffffff;font-size:14px;font-weight:600;">
                      LKR {{ number_format($item->line_total, 2) }}
                    </td>
                  </tr>
                  @endforeach
                </tbody>
              </table>
            </td>
          </tr>
          @endif

          <!-- Totals -->
          <tr>
            <td class="px" style="padding:0 28px 28px;">
              <table role="presentation" align="right" style="min-width:300px">
                <tr>
                  <td style="padding:6px 0;color:#4b5563;font-size:14px;">Subtotal</td>
                  <td align="right" style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">
                    LKR {{ number_format($estimate->subtotal_amount ?? 0, 2) }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#4b5563;font-size:14px;">Discount</td>
                  <td align="right" style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">
                    – LKR {{ number_format($estimate->discount_amount ?? 0, 2) }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#4b5563;font-size:14px;">Tax</td>
                  <td align="right" style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">
                    LKR {{ number_format($estimate->tax_amount ?? 0, 2) }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#4b5563;font-size:14px;">Shipping</td>
                  <td align="right" style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">
                    LKR {{ number_format($estimate->shipping_amount ?? 0, 2) }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-weight:700;color:#111827;border-top:1px solid #e5e7eb;font-size:15px;">Total</td>
                  <td align="right" style="padding:10px 0;font-weight:700;color:#f44032;border-top:1px solid #e5e7eb;font-size:16px;">
                    LKR {{ number_format($estimate->total_amount ?? 0, 2) }}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px" style="padding:0 28px 32px;">
              <table role="presentation" width="100%" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                <tr>
                  <td align="left" style="padding-bottom:16px;">
                    <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
                      We value your business and look forward to working with you on this project.
                    </p>
                    <a href="{{ $viewUrl }}" class="btn" style="margin-right:10px;">View Quotation</a>
                    @if(!empty($downloadUrl))
                      <a href="{{ $downloadUrl }}" class="btn-secondary">Download PDF</a>
                    @endif
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #e5e7eb;padding-top:16px;">
                    <p class="muted" style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                      Need changes or have a question? Reply to this email or call <span style="color:#f44032;font-weight:500;">{{ $companyPhone ?? '+94 76 886 0175' }}</span>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px;text-align:center;background:linear-gradient(135deg, #111827 0%, #1f2937 100%);color:#9ca3af;font-size:13px;border-bottom-left-radius:14px;border-bottom-right-radius:14px;">
              <img src="{{ asset('images/printairlogo.png') }}" width="120" alt="Printair Advertising" style="margin:0 auto 10px;" />
              <div style="margin-bottom:5px;color:#d1d5db;">printair.lk • Walpola, Ragama • Sri Lanka</div>
              <div style="color:#9ca3af;">© {{ now()->year }} Printair Advertising — All rights reserved</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
