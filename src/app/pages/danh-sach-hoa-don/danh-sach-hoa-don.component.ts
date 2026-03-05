import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';

interface InvoiceItem {
  code: string;
  customerName: string;
  createdAt: string;
  totalAmount: number;
  paymentStatus: 'Đã thanh toán' | 'Chưa thanh toán' | 'Đã hủy';
}

@Component({
  selector: 'app-danh-sach-hoa-don',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MenuComponent,
    PaggingComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTagModule
  ],
  templateUrl: './danh-sach-hoa-don.component.html',
  styleUrl: './danh-sach-hoa-don.component.scss'
})
export class DanhSachHoaDonComponent {
  pageIndex = 1;
  readonly pageSize = 5;

  private readonly fb = inject(FormBuilder);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: [''],
    status: ['Tất cả']
  });

  readonly statusOptions = ['Tất cả', 'Đã thanh toán', 'Chưa thanh toán', 'Đã hủy'];

  invoiceList: InvoiceItem[] = [
    { code: 'HD000125', customerName: 'Nguyễn Văn An', createdAt: '2026-03-01', totalAmount: 185000, paymentStatus: 'Đã thanh toán' },
    { code: 'HD000124', customerName: 'Khách lẻ', createdAt: '2026-02-28', totalAmount: 75000, paymentStatus: 'Đã thanh toán' },
    { code: 'HD000123', customerName: 'Trần Thị Bình', createdAt: '2026-02-27', totalAmount: 920000, paymentStatus: 'Chưa thanh toán' },
    { code: 'HD000122', customerName: 'Lê Minh Châu', createdAt: '2026-02-26', totalAmount: 1250000, paymentStatus: 'Đã thanh toán' },
    { code: 'HD000121', customerName: 'Đỗ Ngọc Hà', createdAt: '2026-02-25', totalAmount: 640000, paymentStatus: 'Đã hủy' },
    { code: 'HD000120', customerName: 'Võ Anh Khoa', createdAt: '2026-02-24', totalAmount: 380000, paymentStatus: 'Chưa thanh toán' }
  ];

  get filteredInvoices(): InvoiceItem[] {
    const keyword = this.filterForm.controls.keyword.value.trim().toLowerCase();
    const status = this.filterForm.controls.status.value;

    return this.invoiceList.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.code.toLowerCase().includes(keyword) ||
        item.customerName.toLowerCase().includes(keyword);
      const matchStatus = status === 'Tất cả' || item.paymentStatus === status;
      return matchKeyword && matchStatus;
    });
  }

  get pagedInvoices(): InvoiceItem[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredInvoices.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
  }
}
