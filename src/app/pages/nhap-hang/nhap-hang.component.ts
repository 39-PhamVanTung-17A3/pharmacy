import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { NhapHang, NhapHangService } from './nhap-hang.service';
import { PopupNhapHangComponent } from './popup-nhap-hang/popup-nhap-hang.component';

@Component({
  selector: 'app-nhap-hang',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    PopupNhapHangComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzPopconfirmModule,
    NzTableModule
  ],
  templateUrl: './nhap-hang.component.html',
  styleUrl: './nhap-hang.component.scss'
})
export class NhapHangComponent implements OnInit {
  isPopupOpen = false;
  editingImport: NhapHang | null = null;

  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  deletingId: number | null = null;

  importList: NhapHang[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly nhapHangService = inject(NhapHangService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadImports();
    });

    await this.loadImports();
  }

  openCreatePopup(): void {
    this.editingImport = null;
    this.isPopupOpen = true;
  }

  openEditPopup(item: NhapHang): void {
    this.editingImport = item;
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.editingImport = null;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    void this.loadImports();
  }

  async onImportSaved(_saved: NhapHang): Promise<void> {
    this.pageIndex = 1;
    await this.loadImports();
  }

  async deleteImport(item: NhapHang): Promise<void> {
    if (this.deletingId !== null) {
      return;
    }

    this.deletingId = item.id;
    try {
      await this.nhapHangService.delete(item.id);
      this.notification.success('Thành công', 'Xóa phiếu nhập thành công');

      await this.loadImports();
      if (this.importList.length === 0 && this.pageIndex > 1) {
        this.pageIndex -= 1;
        await this.loadImports();
      }
    } catch (error) {
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại'
          : error instanceof Error
            ? error.message
            : 'Có lỗi xảy ra, vui lòng thử lại';
      this.notification.error('Thất bại', message);
      console.error('Delete nhập hàng failed', error);
    } finally {
      this.deletingId = null;
    }
  }

  formatImportCode(id: number): string {
    return `PN${String(id).padStart(6, '0')}`;
  }

  private async loadImports(): Promise<void> {
    try {
      const keyword = this.filterForm.controls.keyword.value.trim();
      const pageData = await this.nhapHangService.findAll(this.pageIndex, this.pageSize, keyword);
      this.importList = pageData.items;
      this.totalItems = pageData.totalElements;
    } catch (error) {
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại'
          : error instanceof Error
            ? error.message
            : 'Có lỗi xảy ra, vui lòng thử lại';
      this.notification.error('Thất bại', message);
      console.error('Load nhập hàng failed', error);
      this.importList = [];
      this.totalItems = 0;
    }
  }
}