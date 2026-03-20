import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { getErrorMessage } from '../../utils/error.util';
import { CanhBaoTonKho, CanhBaoTonKhoLoai, CanhBaoTonKhoService } from './canh-bao-ton-kho.service';

@Component({
  selector: 'app-canh-bao-ton-kho',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    NzBreadCrumbModule,
    NzCardModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTagModule
  ],
  templateUrl: './canh-bao-ton-kho.component.html',
  styleUrl: './canh-bao-ton-kho.component.scss'
})
export class CanhBaoTonKhoComponent implements OnInit {
  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  loading = false;
  alertList: CanhBaoTonKho[] = [];

  readonly alertTypeOptions: Array<{ value: CanhBaoTonKhoLoai; label: string }> = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'LOW_STOCK', label: 'Sắp hết hàng' },
    { value: 'NEAR_EXPIRY', label: 'Sắp hết hạn' },
    { value: 'EXPIRED', label: 'Đã hết hạn' }
  ];

  private readonly fb = inject(FormBuilder);
  private readonly canhBaoTonKhoService = inject(CanhBaoTonKhoService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: [''],
    alertType: ['ALL' as CanhBaoTonKhoLoai]
  });

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadAlerts();
    });

    this.filterForm.controls.alertType.valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 1;
      void this.loadAlerts();
    });

    await this.loadAlerts();
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    void this.loadAlerts();
  }

  getAlertTypeLabel(type: CanhBaoTonKhoLoai): string {
    switch (type) {
      case 'LOW_STOCK':
        return 'Sắp hết hàng';
      case 'NEAR_EXPIRY':
        return 'Sắp hết hạn';
      case 'EXPIRED':
        return 'Đã hết hạn';
      default:
        return 'Theo dõi';
    }
  }

  private async loadAlerts(): Promise<void> {
    this.loading = true;
    try {
      const keyword = this.filterForm.controls.keyword.value.trim();
      const alertType = this.filterForm.controls.alertType.value;
      const pageData = await this.canhBaoTonKhoService.findAll(this.pageIndex, this.pageSize, keyword, alertType);
      this.alertList = pageData.items;
      this.totalItems = pageData.totalElements;
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách cảnh báo tồn kho');
      this.notification.error('Thất bại', message);
      console.error('Load cảnh báo tồn kho failed', error);
      this.alertList = [];
      this.totalItems = 0;
    } finally {
      this.loading = false;
    }
  }
}
