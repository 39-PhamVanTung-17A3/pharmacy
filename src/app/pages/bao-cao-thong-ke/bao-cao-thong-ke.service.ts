import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BaoCaoReportType,
  BaoCaoThongKeApiResponse,
  BaoCaoThongKeRowApiResponse,
  BaoCaoThongKeRow,
  BaoCaoThongKeSummary
} from '../../models/bao-cao-thong-ke.model';
import { BaseResponse } from '../../models/base-response.model';

export type { BaoCaoReportType, BaoCaoThongKeRow, BaoCaoThongKeSummary } from '../../models/bao-cao-thong-ke.model';

@Injectable({
  providedIn: 'root'
})
export class BaoCaoThongKeService {
  private readonly apiUrl = environment.beDomain + '/api/bao-cao-thong-ke';
  private readonly http = inject(HttpClient);

  async getSummary(type: BaoCaoReportType, keyword?: string, dateRange?: Date[] | null): Promise<BaoCaoThongKeSummary> {
    let params = new HttpParams().set('type', type);

    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      params = params
        .set('fromDate', this.formatDate(dateRange[0]))
        .set('toDate', this.formatDate(dateRange[1]));
    }

    const response = await firstValueFrom(
      this.http.get<BaseResponse<BaoCaoThongKeApiResponse>>(`${this.apiUrl}/summary`, { params })
    );

    const data = this.unwrapData(response);
    return {
      type: data.type,
      rows: data.rows.map((item) => this.mapRowFromApi(item))
    };
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yeu cau that bai');
    }
    return response.data;
  }

  private mapRowFromApi(item: BaoCaoThongKeRowApiResponse): BaoCaoThongKeRow {
    return {
      periodLabel: item.periodLabel,
      invoiceCount: item.invoiceCount,
      revenue: item.revenue,
      cost: item.cost,
      profit: item.profit
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
