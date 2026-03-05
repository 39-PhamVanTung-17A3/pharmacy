import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { CustomerPayload, PopupKhachHangComponent } from './popup-khach-hang/popup-khach-hang.component';

interface CustomerItem {
  name: string;
  phone: string;
  address: string;
  loyaltyLevel: string;
}

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
    NzTableModule
  ],
  templateUrl: './khach-hang.component.html',
  styleUrl: './khach-hang.component.scss'
})
export class KhachHangComponent {
  isPopupOpen = false;
  pageIndex = 1;
  readonly pageSize = 5;

  private readonly fb = inject(FormBuilder);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  customerList: CustomerItem[] = [
    { name: 'Nguyễn Văn An', phone: '0901234567', address: 'Quận 1, TP.HCM', loyaltyLevel: 'Thân thiết' },
    { name: 'Trần Thị Bình', phone: '0912345678', address: 'Quận 3, TP.HCM', loyaltyLevel: 'Thường' },
    { name: 'Lê Minh Châu', phone: '0987654321', address: 'TP. Thủ Đức, TP.HCM', loyaltyLevel: 'VIP' },
    { name: 'Phạm Hoàng Dương', phone: '0977777666', address: 'Quận Bình Thạnh, TP.HCM', loyaltyLevel: 'Thân thiết' },
    { name: 'Đỗ Ngọc Hà', phone: '0934567890', address: 'Quận 10, TP.HCM', loyaltyLevel: 'Thường' },
    { name: 'Võ Anh Khoa', phone: '0922222333', address: 'Quận Tân Bình, TP.HCM', loyaltyLevel: 'VIP' }
  ];

  get filteredCustomers(): CustomerItem[] {
    const keyword = this.filterForm.controls.keyword.value.trim().toLowerCase();
    if (!keyword) {
      return this.customerList;
    }

    return this.customerList.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.phone.toLowerCase().includes(keyword) ||
        item.loyaltyLevel.toLowerCase().includes(keyword)
    );
  }

  get pagedCustomers(): CustomerItem[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
  }

  openPopup(): void {
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
  }

  addCustomer(payload: CustomerPayload): void {
    this.customerList = [
      {
        name: payload.name,
        phone: payload.phone,
        address: payload.address || 'Chưa cập nhật',
        loyaltyLevel: payload.loyaltyLevel
      },
      ...this.customerList
    ];
    this.pageIndex = 1;
  }
}
