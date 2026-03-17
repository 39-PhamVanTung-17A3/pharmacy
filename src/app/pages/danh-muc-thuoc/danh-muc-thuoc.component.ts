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
import { PopupDanhMucThuocComponent } from './popup-danh-muc-thuoc/popup-danh-muc-thuoc.component';
import { DanhMucThuoc, DanhMucThuocService } from './danh-muc-thuoc.service';
import { getErrorMessage } from '../../utils/error.util';

@Component({
  selector: 'app-danh-muc-thuoc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    PopupDanhMucThuocComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzPopconfirmModule,
    NzTableModule
  ],
  templateUrl: './danh-muc-thuoc.component.html',
  styleUrl: './danh-muc-thuoc.component.scss'
})
export class DanhMucThuocComponent implements OnInit {
  isPopupOpen = false;
  editingCategory: DanhMucThuoc | null = null;

  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  deletingId: number | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly danhMucThuocService = inject(DanhMucThuocService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  categoryList: DanhMucThuoc[] = [];

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadCategories();
    });

    await this.loadCategories();
  }

  openCreatePopup(): void {
    this.editingCategory = null;
    this.isPopupOpen = true;
  }

  openEditPopup(item: DanhMucThuoc): void {
    this.editingCategory = item;
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.editingCategory = null;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    void this.loadCategories();
  }

  async onCategorySaved(saved: DanhMucThuoc): Promise<void> {
    this.pageIndex = 1;
    await this.loadCategories();
  }

  async deleteCategory(item: DanhMucThuoc): Promise<void> {
    if (this.deletingId !== null) {
      return;
    }

    this.deletingId = item.id;
    try {
      await this.danhMucThuocService.delete(item.id);
      this.notification.success('Thành công', 'Xóa danh mục thành công');

      await this.loadCategories();
      if (this.categoryList.length === 0 && this.pageIndex > 1) {
        this.pageIndex -= 1;
        await this.loadCategories();
      }
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Delete danh mục thuoc failed', error);
    } finally {
      this.deletingId = null;
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      const keyword = this.filterForm.controls.keyword.value.trim();
      const pageData = await this.danhMucThuocService.findAll(this.pageIndex, this.pageSize, keyword);
      this.categoryList = pageData.items;
      this.totalItems = pageData.totalElements;
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Load danh mục thuoc failed', error);
      this.categoryList = [];
      this.totalItems = 0;
    }
  }
}