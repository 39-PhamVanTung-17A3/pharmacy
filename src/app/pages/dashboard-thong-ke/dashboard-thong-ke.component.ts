import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { MenuComponent } from '../../components/menu/menu.component';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';

@Component({
  selector: 'app-dashboard-thong-ke',
  standalone: true,
  imports: [CommonModule, MenuComponent, NzBreadCrumbModule, NzCardModule, HighchartsChartModule],
  templateUrl: './dashboard-thong-ke.component.html',
  styleUrl: './dashboard-thong-ke.component.scss'
})
export class DashboardThongKeComponent {
  readonly kpis = [
    { label: 'Doanh thu hôm nay', value: '38.500.000 đ' },
    { label: 'Số hóa đơn hôm nay', value: '126' },
    { label: 'Khách hàng mới', value: '34' },
    { label: 'Tỷ lệ lợi nhuận', value: '24.8%' }
  ];

  readonly highcharts = Highcharts;

  readonly revenueChartOptions: Highcharts.Options = {
    title: { text: 'Doanh thu 7 ngày gần nhất' },
    xAxis: { categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] },
    yAxis: {
      title: { text: 'Triệu đồng' }
    },
    legend: { enabled: false },
    series: [
      {
        type: 'line',
        name: 'Doanh thu',
        data: [28, 31, 29, 35, 39, 42, 38]
      }
    ],
    credits: { enabled: false }
  };

  readonly topMedicineChartOptions: Highcharts.Options = {
    title: { text: 'Top thuốc bán chạy' },
    series: [
      {
        type: 'pie',
        name: 'Tỷ trọng',
        data: [
          { name: 'Paracetamol 500mg', y: 28 },
          { name: 'Panadol Extra', y: 22 },
          { name: 'Amoxicillin 500mg', y: 18 },
          { name: 'Vitamin C 1000mg', y: 14 },
          { name: 'Khác', y: 18 }
        ]
      }
    ],
    credits: { enabled: false }
  };
}
