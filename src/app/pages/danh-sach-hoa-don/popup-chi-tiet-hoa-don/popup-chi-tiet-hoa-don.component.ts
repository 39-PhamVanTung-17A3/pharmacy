import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTableModule } from 'ng-zorro-antd/table';
import { getErrorMessage } from '../../../utils/error.util';
import { HoaDon, HoaDonService } from '../../hoa-don/hoa-don.service';

@Component({
  selector: 'app-popup-chi-tiet-hoa-don',
  standalone: true,
  imports: [CommonModule, NzModalModule, NzTableModule, NzButtonModule],
  templateUrl: './popup-chi-tiet-hoa-don.component.html',
  styleUrl: './popup-chi-tiet-hoa-don.component.scss'
})
export class PopupChiTietHoaDonComponent implements OnChanges {
  @Input() open = false;
  @Input() invoiceId: number | null = null;

  @Output() closePopup = new EventEmitter<void>();

  private readonly hoaDonService = inject(HoaDonService);
  private readonly notification = inject(NzNotificationService);

  invoice: HoaDon | null = null;
  loading = false;
  private requestSequence = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) {
      this.invoice = null;
      this.loading = false;
      return;
    }

    if (changes['open'] || changes['invoiceId']) {
      this.loadInvoiceDetail();
    }
  }

  close(): void {
    if (this.loading) {
      return;
    }
    this.closePopup.emit();
  }

  private async loadInvoiceDetail(): Promise<void> {
    if (!this.open || this.invoiceId === null) {
      this.invoice = null;
      return;
    }

    const currentRequest = ++this.requestSequence;
    this.loading = true;
    this.invoice = null;

    try {
      const detail = await this.hoaDonService.findById(this.invoiceId);
      if (currentRequest !== this.requestSequence) {
        return;
      }
      this.invoice = detail;
    } catch (error) {
      if (currentRequest !== this.requestSequence) {
        return;
      }
      const message = getErrorMessage(error, 'Không tải được chi tiết hóa đơn');
      this.notification.error('Thất bại', message);
      this.closePopup.emit();
      console.error('Load chi tiết hóa đơn failed', error);
    } finally {
      if (currentRequest === this.requestSequence) {
        this.loading = false;
      }
    }
  }
}
