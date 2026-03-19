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
import { NhanVien, NhanVienService } from './nhan-vien.service';
import { PopupNhanVienComponent } from './popup-nhan-vien/popup-nhan-vien.component';
import { getErrorMessage } from '../../utils/error.util';

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
    NzPopconfirmModule,
    NzTableModule
  ],
  templateUrl: './nhan-vien.component.html',
  styleUrl: './nhan-vien.component.scss'
})
export class NhanVienComponent implements OnInit {
  private readonly roleLabelMap: Record<string, string> = {
    MANAGER: 'Quản lý',
    ADMIN: 'Quản trị',
    PHARMACIST: 'Dược sĩ',
    CASHIER: 'Thu ngân',
    WAREHOUSE: 'Kho vận'
  };


  isPopupOpen = false;
  editingEmployee: NhanVien | null = null;

  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  deletingId: number | null = null;

  employeeList: NhanVien[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly nhanVienService = inject(NhanVienService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadEmployees();
    });

    await this.loadEmployees();
  }

  openCreatePopup(): void {
    this.editingEmployee = null;
    this.isPopupOpen = true;
  }

  openEditPopup(item: NhanVien): void {
    this.editingEmployee = item;
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.editingEmployee = null;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    void this.loadEmployees();
  }

  async onEmployeeSaved(_saved: NhanVien): Promise<void> {
    this.pageIndex = 1;
    await this.loadEmployees();
  }

  async deleteEmployee(item: NhanVien): Promise<void> {
    if (this.deletingId !== null) {
      return;
    }

    this.deletingId = item.id;
    try {
      await this.nhanVienService.delete(item.id);
      this.notification.success('Thành công', 'Xóa nhân viên thành công');

      await this.loadEmployees();
      if (this.employeeList.length === 0 && this.pageIndex > 1) {
        this.pageIndex -= 1;
        await this.loadEmployees();
      }
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Delete nhân viên failed', error);
    } finally {
      this.deletingId = null;
    }
  }

  private async loadEmployees(): Promise<void> {
    try {
      const keyword = this.filterForm.controls.keyword.value.trim();
      const pageData = await this.nhanVienService.findAll(this.pageIndex, this.pageSize, keyword);
      this.employeeList = pageData.items;
      this.totalItems = pageData.totalElements;
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Load nhân viên failed', error);
      this.employeeList = [];
      this.totalItems = 0;
    }
  }

  getRoleLabel(role: string): string {
    return this.roleLabelMap[role] ?? role;
  }
}