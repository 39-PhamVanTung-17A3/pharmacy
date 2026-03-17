import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { KhachHang, KhachHangService } from './khach-hang.service';
import { PopupKhachHangComponent } from './popup-khach-hang/popup-khach-hang.component';
import { getErrorMessage } from '../../utils/error.util';

@Component({
  selector: 'app-khach-hang',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    PopupKhachHangComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzPopconfirmModule,
    NzTableModule
  ],
  templateUrl: './khach-hang.component.html',
  styleUrl: './khach-hang.component.scss'
})
export class KhachHangComponent implements OnInit {
  isPopupOpen = false;
  editingCustomer: KhachHang | null = null;

  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  deletingId: number | null = null;

  customerList: KhachHang[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly khachHangService = inject(KhachHangService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadCustomers();
    });

    await this.loadCustomers();
  }

  openCreatePopup(): void {
    this.editingCustomer = null;
    this.isPopupOpen = true;
  }

  openEditPopup(item: KhachHang): void {
    this.editingCustomer = item;
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.editingCustomer = null;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    void this.loadCustomers();
  }

  async onCustomerSaved(_saved: KhachHang): Promise<void> {
    this.pageIndex = 1;
    await this.loadCustomers();
  }

  async deleteCustomer(item: KhachHang): Promise<void> {
    if (this.deletingId !== null) {
      return;
    }

    this.deletingId = item.id;
    try {
      await this.khachHangService.delete(item.id);
      this.notification.success('Thành công', 'Xóa khách hàng thành công');

      await this.loadCustomers();
      if (this.customerList.length === 0 && this.pageIndex > 1) {
        this.pageIndex -= 1;
        await this.loadCustomers();
      }
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Delete khách hàng failed', error);
    } finally {
      this.deletingId = null;
    }
  }

  private async loadCustomers(): Promise<void> {
    try {
      const keyword = this.filterForm.controls.keyword.value.trim();
      const pageData = await this.khachHangService.findAll(this.pageIndex, this.pageSize, keyword);
      this.customerList = pageData.items;
      this.totalItems = pageData.totalElements;
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Load khách hàng failed', error);
      this.customerList = [];
      this.totalItems = 0;
    }
  }
}