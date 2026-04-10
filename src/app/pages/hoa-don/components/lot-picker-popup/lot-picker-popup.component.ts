import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NhapHang } from '../../../nhap-hang/nhap-hang.service';

@Component({
  selector: 'app-lot-picker-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lot-picker-popup.component.html',
  styleUrl: './lot-picker-popup.component.scss',
})
export class LotPickerPopupComponent {
  @Input() open = false;
  @Input() title = 'Chọn lô thuốc';
  @Input() subtitle = '';
  @Input() imports: NhapHang[] = [];
  @Input() disabled = false;

  @Output() close = new EventEmitter<void>();
  @Output() pick = new EventEmitter<NhapHang>();

  trackByImportId(_: number, item: NhapHang): number {
    return item.id;
  }

  getDisplayPrice(item: NhapHang): number {
    return item.sellPrice > 0 ? item.sellPrice : item.importPrice;
  }

  onClose(): void {
    this.close.emit();
  }

  onPick(item: NhapHang): void {
    if (this.disabled) {
      return;
    }
    this.pick.emit(item);
  }
}

