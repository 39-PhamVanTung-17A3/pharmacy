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
import { EmployeePayload, PopupNhanVienComponent } from './popup-nhan-vien/popup-nhan-vien.component';

interface EmployeeItem {
  name: string;
  phone: string;
  role: string;
  shift: string;
}

@Component({
  selector: 'app-nhan-vien',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    PopupNhanVienComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzTableModule
  ],
  templateUrl: './nhan-vien.component.html',
  styleUrl: './nhan-vien.component.scss'
})
export class NhanVienComponent {
  isPopupOpen = false;
  pageIndex = 1;
  readonly pageSize = 5;

  private readonly fb = inject(FormBuilder);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  employeeList: EmployeeItem[] = [
    { name: 'Nguyễn Hoàng Nam', phone: '0903001001', role: 'Dược sĩ', shift: 'Ca sáng' },
    { name: 'Trần Thu Trang', phone: '0903001002', role: 'Thu ngân', shift: 'Ca chiều' },
    { name: 'Lê Quang Huy', phone: '0903001003', role: 'Quản lý', shift: 'Hành chính' },
    { name: 'Phạm Mỹ Linh', phone: '0903001004', role: 'Dược sĩ', shift: 'Ca tối' },
    { name: 'Đặng Quốc Bảo', phone: '0903001005', role: 'Kho vận', shift: 'Ca sáng' },
    { name: 'Vũ Thanh Tùng', phone: '0903001006', role: 'Thu ngân', shift: 'Ca tối' }
  ];

  get filteredEmployees(): EmployeeItem[] {
    const keyword = this.filterForm.controls.keyword.value.trim().toLowerCase();
    if (!keyword) {
      return this.employeeList;
    }

    return this.employeeList.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.phone.toLowerCase().includes(keyword) ||
        item.role.toLowerCase().includes(keyword)
    );
  }

  get pagedEmployees(): EmployeeItem[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredEmployees.slice(start, start + this.pageSize);
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

  addEmployee(payload: EmployeePayload): void {
    this.employeeList = [
      {
        name: payload.name,
        phone: payload.phone,
        role: payload.role,
        shift: payload.shift
      },
      ...this.employeeList
    ];
    this.pageIndex = 1;
  }
}
