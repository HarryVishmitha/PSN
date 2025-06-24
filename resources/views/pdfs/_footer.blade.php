{{-- resources/views/pdfs/_footer.blade.php --}}
<div
    style="
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
      font-size: 0.75rem;
      color: #94a3b8;
    "
>
  <div style="padding: 0 0.75rem;">System Authorized.</div>

  <div style="padding: 0 0.75rem;">
    <script type="text/php">
      if (isset($pdf)) {
          $font      = $fontMetrics->getFont("Helvetica", "normal");
          $size      = 10;
          $text      = "Page {PAGE_NUM} of {PAGE_COUNT}";
          $width     = $pdf->get_width();
          $textWidth = $fontMetrics->get_text_width($text, $font, $size);
          $x = ($width - $textWidth) / 2;
          $y = $pdf->get_height() - 15;
          $pdf->page_text($x, $y, $text, $font, $size, [0,0,0]);
      }
    </script>
  </div>

  <div style="padding: 0 0.75rem;">www.printair.lk</div>
</div>
