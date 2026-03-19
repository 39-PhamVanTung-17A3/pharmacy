import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import {
  BaoCaoComparisonApiResponse,
  BaoCaoMedicineRankingApiResponse,
  BaoCaoStockAlertApiResponse,
  BaoCaoThongKeKpiApiResponse
} from '../../models/bao-cao-thong-ke.model';
import { getErrorMessage } from '../../utils/error.util';
import { BaoCaoReportType, BaoCaoThongKeRow, BaoCaoThongKeService } from './bao-cao-thong-ke.service';

@Component({
  selector: 'app-bao-cao-thong-ke',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MenuComponent,
    PaggingComponent,
    NzBreadCrumbModule,
    NzCardModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    HighchartsChartModule
  ],
  templateUrl: './bao-cao-thong-ke.component.html',
  styleUrl: './bao-cao-thong-ke.component.scss'
})
export class BaoCaoThongKeComponent implements OnInit, OnDestroy {
  pageIndex = 1;
  readonly pageSize = 5;
  loading = false;

  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly baoCaoThongKeService = inject(BaoCaoThongKeService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.group({
    keyword: this.fb.nonNullable.control(''),
    type: this.fb.nonNullable.control<BaoCaoReportType>('MONTH'),
    dateRange: this.fb.control<Date[] | null>(null)
  });

  readonly reportTypeOptions: Array<{ label: string; value: BaoCaoReportType }> = [
    { label: 'Ngày', value: 'DAY' },
    { label: 'Tháng', value: 'MONTH' },
    { label: 'Quý', value: 'QUARTER' },
    { label: 'Năm', value: 'YEAR' }
  ];

  reportRows: BaoCaoThongKeRow[] = [];
  kpiTongHop: BaoCaoThongKeKpiApiResponse = {
    totalInvoiceCount: 0,
    totalSoldQuantity: 0,
    grossRevenue: 0,
    totalDiscount: 0,
    netRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    grossMarginPercent: 0,
    averageOrderValue: 0,
    inventoryValue: 0,
    lowStockCount: 0,
    expiringWithin90DaysCount: 0
  };
  topSellingMedicines: BaoCaoMedicineRankingApiResponse[] = [];
  slowSellingMedicines: BaoCaoMedicineRankingApiResponse[] = [];
  lowStockMedicines: BaoCaoStockAlertApiResponse[] = [];
  expiringMedicines: BaoCaoStockAlertApiResponse[] = [];
  comparison: BaoCaoComparisonApiResponse = {
    currentPeriodLabel: null,
    previousPeriodLabel: null,
    currentInvoiceCount: 0,
    previousInvoiceCount: 0,
    currentRevenue: 0,
    previousRevenue: 0,
    revenueChangePercent: 0,
    currentProfit: 0,
    previousProfit: 0,
    profitChangePercent: 0
  };

  readonly highcharts = Highcharts;
  reportChartOptions: Highcharts.Options = {
    chart: { type: 'column' },
    title: { text: 'Doanh thu và lợi nhuận theo kỳ' },
    xAxis: { categories: [] },
    yAxis: { title: { text: 'VNĐ' } },
    series: [
      { type: 'column', name: 'Doanh thu', data: [] },
      { type: 'column', name: 'Chi phí', data: [] },
      { type: 'column', name: 'Lợi nhuận', data: [] }
    ],
    credits: { enabled: false }
  };

  categoryChartOptions: Highcharts.Options = {
    chart: { type: 'bar' },
    title: { text: 'Doanh thu theo nhóm thuốc' },
    xAxis: { categories: [] },
    yAxis: { title: { text: 'VNĐ' } },
    legend: { enabled: false },
    series: [{ type: 'bar', name: 'Doanh thu', data: [] }],
    credits: { enabled: false }
  };

  hourlyChartOptions: Highcharts.Options = {
    chart: { type: 'line' },
    title: { text: 'Doanh thu theo khung giờ' },
    xAxis: { categories: [] },
    yAxis: { title: { text: 'VNĐ' } },
    legend: { enabled: false },
    series: [{ type: 'line', name: 'Doanh thu', data: [] }],
    credits: { enabled: false }
  };

  async ngOnInit(): Promise<void> {
    this.bindFilters();
    await this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pagedRows(): BaoCaoThongKeRow[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.reportRows.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
  }

  private bindFilters(): void {
    this.filterForm.controls.keyword.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(async () => {
        this.pageIndex = 1;
        await this.loadSummary();
      });

    this.filterForm.controls.type.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(async () => {
      this.pageIndex = 1;
      await this.loadSummary();
    });

    this.filterForm.controls.dateRange.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(async () => {
      this.pageIndex = 1;
      await this.loadSummary();
    });
  }

  private async loadSummary(): Promise<void> {
    this.loading = true;
    try {
      const type = this.filterForm.controls.type.value;
      const keyword = this.filterForm.controls.keyword.value;
      const dateRange = this.filterForm.controls.dateRange.value;

      const data = await this.baoCaoThongKeService.getSummary(type, keyword, dateRange);
      this.reportRows = data.rows;
      this.kpiTongHop = data.kpi;
      this.topSellingMedicines = data.topSellingMedicines;
      this.slowSellingMedicines = data.slowSellingMedicines;
      this.lowStockMedicines = data.lowStockMedicines;
      this.expiringMedicines = data.expiringMedicines;
      this.comparison = data.comparison;
      this.buildReportChart(this.reportRows, type);
      this.buildCategoryChart(data.categoryRevenue);
      this.buildHourlyChart(data.hourlyRevenue);
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được dữ liệu báo cáo thống kê');
      this.notification.error('Thất bại', message);
    } finally {
      this.loading = false;
    }
  }

  private buildReportChart(rows: BaoCaoThongKeRow[], type: BaoCaoReportType): void {
    const titleType = this.reportTypeOptions.find((item) => item.value === type)?.label ?? 'kỳ';
    this.reportChartOptions = {
      ...this.reportChartOptions,
      title: { text: `Doanh thu, chi phí và lợi nhuận theo ${titleType.toLowerCase()}` },
      xAxis: { categories: rows.map((item) => item.periodLabel) },
      series: [
        { type: 'column', name: 'Doanh thu', data: rows.map((item) => item.revenue) },
        { type: 'column', name: 'Chi phí', data: rows.map((item) => item.cost) },
        { type: 'column', name: 'Lợi nhuận', data: rows.map((item) => item.profit) }
      ]
    };
  }

  private buildCategoryChart(categoryRevenue: Array<{ categoryName: string; revenue: number }>): void {
    this.categoryChartOptions = {
      ...this.categoryChartOptions,
      xAxis: { categories: categoryRevenue.map((item) => item.categoryName) },
      series: [{ type: 'bar', name: 'Doanh thu', data: categoryRevenue.map((item) => item.revenue) }]
    };
  }

  private buildHourlyChart(hourlyRevenue: Array<{ hourLabel: string; revenue: number }>): void {
    this.hourlyChartOptions = {
      ...this.hourlyChartOptions,
      xAxis: { categories: hourlyRevenue.map((item) => item.hourLabel) },
      series: [{ type: 'line', name: 'Doanh thu', data: hourlyRevenue.map((item) => item.revenue) }]
    };
  }
}
