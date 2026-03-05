import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';

interface ReportRow {
  month: string;
  invoices: number;
  revenue: number;
  cost: number;
}

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
export class BaoCaoThongKeComponent {
  pageIndex = 1;
  readonly pageSize = 5;

  private readonly fb = inject(FormBuilder);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: [''],
    type: ['Tháng']
  });

  readonly reportTypeOptions = ['Tháng', 'Quý', 'Năm'];

  reportRows: ReportRow[] = [
    { month: '01/2026', invoices: 3120, revenue: 920000000, cost: 690000000 },
    { month: '02/2026', invoices: 3280, revenue: 980000000, cost: 725000000 },
    { month: '03/2026', invoices: 3410, revenue: 1025000000, cost: 756000000 },
    { month: '04/2026', invoices: 3550, revenue: 1090000000, cost: 801000000 },
    { month: '05/2026', invoices: 3670, revenue: 1145000000, cost: 835000000 },
    { month: '06/2026', invoices: 3810, revenue: 1198000000, cost: 872000000 }
  ];

  readonly highcharts = Highcharts;

  readonly reportChartOptions: Highcharts.Options = {
    chart: { type: 'column' },
    title: { text: 'Doanh thu và chi phí theo tháng' },
    xAxis: { categories: ['01/2026', '02/2026', '03/2026', '04/2026', '05/2026', '06/2026'] },
    yAxis: { title: { text: 'Triệu đồng' } },
    series: [
      {
        type: 'column',
        name: 'Doanh thu',
        data: [920, 980, 1025, 1090, 1145, 1198]
      },
      {
        type: 'column',
        name: 'Chi phí',
        data: [690, 725, 756, 801, 835, 872]
      }
    ],
    credits: { enabled: false }
  };

  get filteredRows(): ReportRow[] {
    const keyword = this.filterForm.controls.keyword.value.trim().toLowerCase();
    if (!keyword) {
      return this.reportRows;
    }

    return this.reportRows.filter((row) => row.month.toLowerCase().includes(keyword));
  }

  get pagedRows(): ReportRow[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  getProfit(item: ReportRow): number {
    return item.revenue - item.cost;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
  }
}
