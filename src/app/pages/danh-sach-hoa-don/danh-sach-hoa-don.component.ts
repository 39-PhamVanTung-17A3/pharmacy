import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { getErrorMessage } from '../../utils/error.util';
import { HoaDon, HoaDonService } from '../hoa-don/hoa-don.service';
import { PopupChiTietHoaDonComponent } from './popup-chi-tiet-hoa-don/popup-chi-tiet-hoa-don.component';

@Component({
  selector: 'app-danh-sach-hoa-don',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MenuComponent,
    PaggingComponent,
    PopupChiTietHoaDonComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzTableModule,
    NzTagModule
  ],
  templateUrl: './danh-sach-hoa-don.component.html',
  styleUrl: './danh-sach-hoa-don.component.scss'
})
export class DanhSachHoaDonComponent implements OnInit {
  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  loading = false;
  viewingInvoiceId: number | null = null;
  viewDetailOpen = false;
  deletingId: number | null = null;
  deleteConfirmOpen = false;
  deletingInvoice: HoaDon | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly hoaDonService = inject(HoaDonService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  invoices: HoaDon[] = [];

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 1;
        this.loadInvoices();
      });

    await this.loadInvoices();
  }

  openDeleteConfirm(invoice: HoaDon): void {
    this.deletingInvoice = invoice;
    this.deleteConfirmOpen = true;
  }

  openViewDetail(invoice: HoaDon): void {
    this.viewDetailOpen = true;
    this.viewingInvoiceId = invoice.id;
  }

  closeViewDetail(): void {
    this.viewDetailOpen = false;
    this.viewingInvoiceId = null;
  }

  closeDeleteConfirm(force = false): void {
    if (!force && this.deletingId !== null) {
      return;
    }
    this.deleteConfirmOpen = false;
    this.deletingInvoice = null;
  }

  async confirmDelete(rollbackStock: boolean): Promise<void> {
    if (!this.deletingInvoice) {
      return;
    }

    this.deletingId = this.deletingInvoice.id;
    try {
      await this.hoaDonService.delete(this.deletingInvoice.id, rollbackStock);
      this.notification.success(
        'Thành công',
        rollbackStock ? 'Đã xóa hóa đơn và hoàn lại hàng vào kho' : 'Đã xóa hóa đơn, không hoàn lại hàng'
      );
      this.closeDeleteConfirm(true);
      await this.loadInvoices();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể xóa hóa đơn');
      this.notification.error('Thất bại', message);
      console.error('Delete hóa đơn failed', error);
    } finally {
      this.deletingId = null;
    }
  }

  async onPageChange(page: number): Promise<void> {
    this.pageIndex = page;
    await this.loadInvoices();
  }

  private async loadInvoices(): Promise<void> {
    this.loading = true;
    try {
      const pageData = await this.hoaDonService.findAll(this.pageIndex, this.pageSize, this.filterForm.controls.keyword.value);
      this.invoices = pageData.items;
      this.totalItems = pageData.totalElements;
      this.pageIndex = pageData.page;
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách hóa đơn');
      this.notification.error('Thất bại', message);
      this.invoices = [];
      this.totalItems = 0;
      console.error('Load danh sách hóa đơn failed', error);
    } finally {
      this.loading = false;
    }
  }
}
