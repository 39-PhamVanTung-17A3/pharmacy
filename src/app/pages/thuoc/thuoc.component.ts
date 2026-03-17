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
import { PopupThuocComponent } from './popup-thuoc/popup-thuoc.component';
import { Thuoc, ThuocService } from './thuoc.service';
import { getErrorMessage } from '../../utils/error.util';

@Component({
  selector: 'app-thuoc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    PopupThuocComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzPopconfirmModule,
    NzTableModule
  ],
  templateUrl: './thuoc.component.html',
  styleUrl: './thuoc.component.scss'
})
export class ThuocComponent implements OnInit {
  isPopupOpen = false;
  editingMedicine: Thuoc | null = null;

  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  deletingId: number | null = null;

  medicineList: Thuoc[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly thuocService = inject(ThuocService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadMedicines();
    });

    await this.loadMedicines();
  }

  openCreatePopup(): void {
    this.editingMedicine = null;
    this.isPopupOpen = true;
  }

  openEditPopup(item: Thuoc): void {
    this.editingMedicine = item;
    this.isPopupOpen = true;
  }

  closePopup(): void {
    this.isPopupOpen = false;
    this.editingMedicine = null;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    void this.loadMedicines();
  }

  async onMedicineSaved(_saved: Thuoc): Promise<void> {
    this.pageIndex = 1;
    await this.loadMedicines();
  }

  async deleteMedicine(item: Thuoc): Promise<void> {
    if (this.deletingId !== null) {
      return;
    }

    this.deletingId = item.id;
    try {
      await this.thuocService.delete(item.id);
      this.notification.success('Thành công', 'Xóa thuốc thành công');

      await this.loadMedicines();
      if (this.medicineList.length === 0 && this.pageIndex > 1) {
        this.pageIndex -= 1;
        await this.loadMedicines();
      }
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Delete thuốc failed', error);
    } finally {
      this.deletingId = null;
    }
  }

  private async loadMedicines(): Promise<void> {
    try {
      const keyword = this.filterForm.controls.keyword.value.trim();
      const pageData = await this.thuocService.findAll(this.pageIndex, this.pageSize, keyword);
      this.medicineList = pageData.items;
      this.totalItems = pageData.totalElements;
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Load thuốc failed', error);
      this.medicineList = [];
      this.totalItems = 0;
    }
  }
}
