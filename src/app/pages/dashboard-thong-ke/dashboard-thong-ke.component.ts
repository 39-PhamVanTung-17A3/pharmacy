import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { MenuComponent } from '../../components/menu/menu.component';
import { getErrorMessage } from '../../utils/error.util';
import { DashboardOverview, DashboardPeriod, DashboardThongKeService } from './dashboard-thong-ke.service';

interface KpiItem {
  label: string;
  value: string;
}

interface InsightItem {
  label: string;
  value: string;
  hint: string;
}

@Component({
  selector: 'app-dashboard-thong-ke',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuComponent, NzBreadCrumbModule, NzCardModule, NzSelectModule, HighchartsChartModule],
  templateUrl: './dashboard-thong-ke.component.html',
  styleUrl: './dashboard-thong-ke.component.scss',
  providers: [CurrencyPipe, DecimalPipe, PercentPipe]
})
export class DashboardThongKeComponent implements OnInit {
  private readonly dashboardService = inject(DashboardThongKeService);
  private readonly notification = inject(NzNotificationService);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly decimalPipe = inject(DecimalPipe);
  private readonly percentPipe = inject(PercentPipe);

  readonly highcharts = Highcharts;
  loading = false;

  selectedPeriod: DashboardPeriod = 'WEEK';
  readonly periodOptions: Array<{ label: string; value: DashboardPeriod }> = [
    { label: 'Ngày', value: 'DAY' },
    { label: 'Tuần', value: 'WEEK' },
    { label: 'Tháng', value: 'MONTH' },
    { label: 'Quý', value: 'QUARTER' },
    { label: 'Năm', value: 'YEAR' }
  ];

  kpis: KpiItem[] = [
    { label: 'Tổng doanh thu', value: '--' },
    { label: 'Tổng hóa đơn', value: '--' },
    { label: 'Khách hàng mới', value: '--' },
    { label: 'Tỷ lệ lợi nhuận', value: '--' }
  ];

  insights: InsightItem[] = [
    { label: 'Doanh thu trung bình/điểm', value: '--', hint: 'Trung bình mỗi mốc trong biểu đồ' },
    { label: 'Doanh thu cao nhất', value: '--', hint: 'Mốc cao nhất trong kỳ' },
    { label: 'Doanh thu thấp nhất', value: '--', hint: 'Mốc thấp nhất trong kỳ' },
    { label: 'Đóng góp thuốc bán chạy nhất', value: '--', hint: 'Tỷ trọng theo số lượng bán' }
  ];

  revenueChartOptions: Highcharts.Options = {
    chart: { type: 'line' },
    title: { text: 'Xu hướng doanh thu theo kỳ' },
    xAxis: { categories: [] },
    yAxis: { title: { text: 'VNĐ' } },
    legend: { enabled: false },
    series: [
      {
        type: 'line',
        name: 'Doanh thu',
        data: []
      }
    ],
    credits: { enabled: false }
  };

  topMedicineChartOptions: Highcharts.Options = {
    chart: { type: 'pie' },
    title: { text: 'Cơ cấu top thuốc bán chạy' },
    series: [
      {
        type: 'pie',
        name: 'Số lượng bán',
        data: []
      }
    ],
    credits: { enabled: false }
  };

  topMedicineBarChartOptions: Highcharts.Options = {
    chart: { type: 'column' },
    title: { text: 'Số lượng bán theo top thuốc' },
    xAxis: {
      categories: [],
      title: { text: null }
    },
    yAxis: {
      min: 0,
      title: { text: 'Số lượng' }
    },
    legend: { enabled: false },
    series: [
      {
        type: 'column',
        name: 'Số lượng',
        data: []
      }
    ],
    credits: { enabled: false }
  };

  async ngOnInit(): Promise<void> {
    await this.loadDashboardOverview();
  }

  async onPeriodChange(): Promise<void> {
    await this.loadDashboardOverview();
  }

  private async loadDashboardOverview(): Promise<void> {
    this.loading = true;
    try {
      const overview = await this.dashboardService.getOverview(this.selectedPeriod);

      this.buildKpis(overview);
      this.buildInsights(overview);
      this.buildRevenueChart(overview);
      this.buildTopMedicineCharts(overview);
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được dữ liệu dashboard');
      this.notification.error('Thất bại', message);
    } finally {
      this.loading = false;
    }
  }

  private buildKpis(overview: DashboardOverview): void {
    this.kpis = [
      {
        label: 'Tổng doanh thu',
        value: this.toVnd(overview.totalRevenue)
      },
      {
        label: 'Tổng hóa đơn',
        value: this.toNumber(overview.invoiceCount)
      },
      {
        label: 'Khách hàng mới',
        value: this.toNumber(overview.newCustomers)
      },
      {
        label: 'Tỷ lệ lợi nhuận',
        value: this.toPercent(overview.profitRatePercent)
      }
    ];
  }

  private buildInsights(overview: DashboardOverview): void {
    const points = overview.revenueSeries.map((item) => item.revenue ?? 0);
    const total = points.reduce((sum, value) => sum + value, 0);
    const avg = points.length > 0 ? total / points.length : 0;
    const max = points.length > 0 ? Math.max(...points) : 0;
    const min = points.length > 0 ? Math.min(...points) : 0;

    const totalTopMedicineQuantity = overview.topMedicines.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    const topOneQuantity = overview.topMedicines[0]?.quantity ?? 0;
    const topOneShare = totalTopMedicineQuantity > 0 ? (topOneQuantity * 100) / totalTopMedicineQuantity : 0;

    this.insights = [
      {
        label: 'Doanh thu trung bình/điểm',
        value: this.toVnd(avg),
        hint: 'Trung bình mỗi mốc trong biểu đồ'
      },
      {
        label: 'Doanh thu cao nhất',
        value: this.toVnd(max),
        hint: 'Mốc cao nhất trong kỳ'
      },
      {
        label: 'Doanh thu thấp nhất',
        value: this.toVnd(min),
        hint: 'Mốc thấp nhất trong kỳ'
      },
      {
        label: 'Đóng góp thuốc bán chạy nhất',
        value: this.toPercent(topOneShare),
        hint: 'Tỷ trọng theo số lượng bán'
      }
    ];
  }

  private buildRevenueChart(overview: DashboardOverview): void {
    this.revenueChartOptions = {
      ...this.revenueChartOptions,
      xAxis: {
        categories: overview.revenueSeries.map((item) => item.label)
      },
      series: [
        {
          type: 'line',
          name: 'Doanh thu',
          data: overview.revenueSeries.map((item) => item.revenue)
        }
      ]
    };
  }

  private buildTopMedicineCharts(overview: DashboardOverview): void {
    this.topMedicineChartOptions = {
      ...this.topMedicineChartOptions,
      series: [
        {
          type: 'pie',
          name: 'Số lượng bán',
          data: overview.topMedicines.map((item) => ({
            name: item.name,
            y: item.quantity
          }))
        }
      ]
    };

    this.topMedicineBarChartOptions = {
      ...this.topMedicineBarChartOptions,
      xAxis: {
        categories: overview.topMedicines.map((item) => item.name),
        title: { text: null }
      },
      series: [
        {
          type: 'column',
          name: 'Số lượng',
          data: overview.topMedicines.map((item) => item.quantity)
        }
      ]
    };
  }

  private toVnd(value: number): string {
    return this.currencyPipe.transform(value ?? 0, 'VND', 'symbol-narrow', '1.0-0', 'vi') ?? '0 đ';
  }

  private toNumber(value: number): string {
    return this.decimalPipe.transform(value ?? 0, '1.0-0') ?? '0';
  }

  private toPercent(value: number): string {
    return this.percentPipe.transform((value ?? 0) / 100, '1.0-2') ?? '0%';
  }
}

