import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../models/base-response.model';

export type DashboardPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';

export interface DashboardRevenuePoint {
  label: string;
  revenue: number;
}

export interface DashboardTopMedicine {
  name: string;
  quantity: number;
}

export interface DashboardOverview {
  period: DashboardPeriod;
  totalRevenue: number;
  invoiceCount: number;
  newCustomers: number;
  profitRatePercent: number;
  revenueSeries: DashboardRevenuePoint[];
  topMedicines: DashboardTopMedicine[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardThongKeService {
  private readonly apiUrl = environment.beDomain + '/api/dashboard';
  private readonly http = inject(HttpClient);

  async getOverview(period: DashboardPeriod): Promise<DashboardOverview> {
    const params = new HttpParams().set('period', period);
    const result = await firstValueFrom(
      this.http.get<BaseResponse<DashboardOverview>>(`${this.apiUrl}/overview`, { params })
    );
    return this.unwrapData(result);
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yeu cau that bai');
    }
    return response.data;
  }
}

