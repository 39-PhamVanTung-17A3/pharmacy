import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { getErrorMessage } from '../../utils/error.util';
import { CongNoKhachHang, CongNoKhachHangService } from './cong-no-khach-hang.service';

@Component({
  selector: 'app-cong-no-khach-hang',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzTableModule
  ],
  templateUrl: './cong-no-khach-hang.component.html',
  styleUrl: './cong-no-khach-hang.component.scss'
})
export class CongNoKhachHangComponent implements OnInit {
  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  debtList: CongNoKhachHang[] = [];
  loading = false;
  collecting = false;
  isCollectPopupOpen = false;
  selectedDebt: CongNoKhachHang | null = null;

  private readonly fb = inject(FormBuilder);
  private readonly congNoService = inject(CongNoKhachHangService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  readonly collectForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(1)]]
  });

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadDebtData();
    });
    await this.loadDebtData();
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    void this.loadDebtData();
  }

  openCollectPopup(item: CongNoKhachHang): void {
    this.selectedDebt = item;
    this.isCollectPopupOpen = true;
    this.collectForm.reset({
      amount: Math.max(Math.round(item.totalDebt), 1)
    });
  }

  closeCollectPopup(): void {
    if (this.collecting) {
      return;
    }
    this.selectedDebt = null;
    this.isCollectPopupOpen = false;
  }

  async submitCollectDebt(): Promise<void> {
    if (!this.selectedDebt) {
      return;
    }
    if (this.collectForm.invalid || this.collecting) {
      this.collectForm.markAllAsTouched();
      return;
    }

    this.collecting = true;
    try {
      const amount = Number(this.collectForm.controls.amount.value) || 0;
      await this.congNoService.collectDebt(this.selectedDebt.customerId, amount);
      this.notification.success('Thành công', 'Thu nợ khách hàng thành công');
      this.closeCollectPopup();
      await this.loadDebtData();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể thu nợ khách hàng');
      this.notification.error('Thất bại', message);
      console.error('Thu nợ khách hàng failed', error);
    } finally {
      this.collecting = false;
    }
  }

  private async loadDebtData(): Promise<void> {
    this.loading = true;
    try {
      const keyword = this.filterForm.controls.keyword.value.trim();
      const pageData = await this.congNoService.findAll(this.pageIndex, this.pageSize, keyword);
      this.debtList = pageData.items;
      this.totalItems = pageData.totalElements;
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách công nợ khách hàng');
      this.notification.error('Thất bại', message);
      console.error('Load công nợ khách hàng failed', error);
      this.debtList = [];
      this.totalItems = 0;
    } finally {
      this.loading = false;
    }
  }
}
