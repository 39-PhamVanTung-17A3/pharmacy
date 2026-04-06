import { HoaDon } from '../models/hoa-don.model';

function toStatusLabel(status: HoaDon['status']): string {
  switch (status) {
    case 'PAID':
      return 'Đã thanh toán';
    case 'PENDING_PAYMENT':
      return 'Chờ thanh toán';
    case 'DEBT':
      return 'Khách nợ';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value || 0) + ' đ';
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildInvoiceReceiptHtml(invoice: HoaDon): string {
  const saleAt = formatDateTime(invoice.saleAt);
  const customer = escapeHtml(invoice.customerName || 'Khách lẻ');
  const status = escapeHtml(toStatusLabel(invoice.status));
  const rows = invoice.items
    .map((item) => {
      const medicineName = escapeHtml(item.medicineName);
      const batchCode = escapeHtml(item.batchCode);
      return `
        <tr>
          <td class="left">
            <div>${medicineName}</div>
            <small>Lô: ${batchCode}</small>
          </td>
          <td class="center">${item.quantity}</td>
          <td class="right">${formatMoney(item.unitPrice)}</td>
          <td class="right">${formatMoney(item.lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Hóa đơn ${escapeHtml(invoice.code)}</title>
      <style>
        @page { margin: 8mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
        .receipt { width: 100%; max-width: 76mm; margin: 0 auto; font-size: 12px; }
        .center { text-align: center; }
        .left { text-align: left; }
        .right { text-align: right; }
        h1 { margin: 0 0 6px; font-size: 16px; }
        .meta { margin: 2px 0; line-height: 1.35; }
        .line { border-top: 1px dashed #374151; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 4px 0; vertical-align: top; }
        th { font-size: 11px; border-bottom: 1px solid #374151; }
        tfoot td { border-top: 1px solid #374151; padding-top: 6px; }
        .summary-row { display: flex; justify-content: space-between; margin: 3px 0; }
        .thanks { margin-top: 8px; font-style: italic; text-align: center; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <h1 class="center">NHÀ THUỐC PHARMACY</h1>
        <div class="meta">Mã hóa đơn: <strong>${escapeHtml(invoice.code)}</strong></div>
        <div class="meta">Thời gian: ${saleAt}</div>
        <div class="meta">Khách hàng: ${customer}</div>
        <div class="meta">Trạng thái: ${status}</div>
        <div class="line"></div>

        <table>
          <thead>
            <tr>
              <th class="left">Sản phẩm</th>
              <th class="center">SL</th>
              <th class="right">Đơn giá</th>
              <th class="right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="line"></div>
        <div class="summary-row"><span>Tạm tính</span><strong>${formatMoney(invoice.subtotal)}</strong></div>
        <div class="summary-row"><span>Giảm giá</span><strong>${formatMoney(invoice.discount)}</strong></div>
        <div class="summary-row"><span>Cần thanh toán</span><strong>${formatMoney(invoice.totalNeedPay)}</strong></div>
        <div class="summary-row"><span>Khách đưa</span><strong>${formatMoney(invoice.amountPaid)}</strong></div>
        <div class="summary-row"><span>Tiền thừa</span><strong>${formatMoney(invoice.returnAmount)}</strong></div>
        <div class="thanks">Cảm ơn quý khách!</div>
      </div>
    </body>
    </html>
  `;
}

export function printInvoiceViaPopup(invoice: HoaDon): boolean {
  const printWindow = window.open('', '_blank', 'width=450,height=800');
  if (!printWindow) {
    return false;
  }

  const html = buildInvoiceReceiptHtml(invoice);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  let hasTriggeredPrint = false;
  const triggerPrint = () => {
    if (hasTriggeredPrint) {
      return;
    }
    hasTriggeredPrint = true;
    setTimeout(() => {
      printWindow.print();
    }, 350);
  };

  printWindow.addEventListener('load', triggerPrint, { once: true });
  printWindow.addEventListener(
    'afterprint',
    () => {
      printWindow.close();
    },
    { once: true }
  );

  // Fallback for browsers that do not emit load on document.write/popups.
  setTimeout(triggerPrint, 700);

  return true;
}
