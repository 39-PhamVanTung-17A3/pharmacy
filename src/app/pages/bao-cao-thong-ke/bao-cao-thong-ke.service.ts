import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BaoCaoReportType,
  BaoCaoThongKeApiResponse,
  BaoCaoComparisonApiResponse,
  BaoCaoThongKeKpiApiResponse,
  BaoCaoMedicineRankingApiResponse,
  BaoCaoStockAlertApiResponse,
  BaoCaoCategoryRevenueApiResponse,
  BaoCaoHourRevenueApiResponse,
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
      rows: data.rows.map((item) => this.mapRowFromApi(item)),
      kpi: this.mapKpiFromApi(data.kpi),
      topSellingMedicines: (data.topSellingMedicines ?? []).map((item) => this.mapMedicineRankingFromApi(item)),
      slowSellingMedicines: (data.slowSellingMedicines ?? []).map((item) => this.mapMedicineRankingFromApi(item)),
      lowStockMedicines: (data.lowStockMedicines ?? []).map((item) => this.mapStockAlertFromApi(item)),
      expiringMedicines: (data.expiringMedicines ?? []).map((item) => this.mapStockAlertFromApi(item)),
      categoryRevenue: (data.categoryRevenue ?? []).map((item) => this.mapCategoryRevenueFromApi(item)),
      hourlyRevenue: (data.hourlyRevenue ?? []).map((item) => this.mapHourRevenueFromApi(item)),
      comparison: this.mapComparisonFromApi(data.comparison)
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

  private mapKpiFromApi(item: BaoCaoThongKeKpiApiResponse): BaoCaoThongKeKpiApiResponse {
    return {
      totalInvoiceCount: item?.totalInvoiceCount ?? 0,
      totalSoldQuantity: item?.totalSoldQuantity ?? 0,
      grossRevenue: item?.grossRevenue ?? 0,
      totalDiscount: item?.totalDiscount ?? 0,
      netRevenue: item?.netRevenue ?? 0,
      totalCost: item?.totalCost ?? 0,
      grossProfit: item?.grossProfit ?? 0,
      grossMarginPercent: item?.grossMarginPercent ?? 0,
      averageOrderValue: item?.averageOrderValue ?? 0,
      inventoryValue: item?.inventoryValue ?? 0,
      lowStockCount: item?.lowStockCount ?? 0,
      expiringWithin90DaysCount: item?.expiringWithin90DaysCount ?? 0
    };
  }

  private mapMedicineRankingFromApi(item: BaoCaoMedicineRankingApiResponse): BaoCaoMedicineRankingApiResponse {
    return {
      medicineName: item?.medicineName ?? '',
      categoryName: item?.categoryName ?? '',
      soldQuantity: item?.soldQuantity ?? 0,
      revenue: item?.revenue ?? 0
    };
  }

  private mapStockAlertFromApi(item: BaoCaoStockAlertApiResponse): BaoCaoStockAlertApiResponse {
    return {
      medicineName: item?.medicineName ?? '',
      categoryName: item?.categoryName ?? '',
      batchCode: item?.batchCode ?? '',
      quantity: item?.quantity ?? 0,
      inventoryValue: item?.inventoryValue ?? 0,
      expiryDate: item?.expiryDate ?? null,
      daysToExpiry: item?.daysToExpiry ?? null,
      supplier: item?.supplier ?? null
    };
  }

  private mapCategoryRevenueFromApi(item: BaoCaoCategoryRevenueApiResponse): BaoCaoCategoryRevenueApiResponse {
    return {
      categoryName: item?.categoryName ?? '',
      soldQuantity: item?.soldQuantity ?? 0,
      revenue: item?.revenue ?? 0
    };
  }

  private mapHourRevenueFromApi(item: BaoCaoHourRevenueApiResponse): BaoCaoHourRevenueApiResponse {
    return {
      hourLabel: item?.hourLabel ?? '',
      invoiceCount: item?.invoiceCount ?? 0,
      revenue: item?.revenue ?? 0
    };
  }

  private mapComparisonFromApi(item: BaoCaoComparisonApiResponse | null | undefined): BaoCaoComparisonApiResponse {
    return {
      currentPeriodLabel: item?.currentPeriodLabel ?? null,
      previousPeriodLabel: item?.previousPeriodLabel ?? null,
      currentInvoiceCount: item?.currentInvoiceCount ?? 0,
      previousInvoiceCount: item?.previousInvoiceCount ?? 0,
      currentRevenue: item?.currentRevenue ?? 0,
      previousRevenue: item?.previousRevenue ?? 0,
      revenueChangePercent: item?.revenueChangePercent ?? 0,
      currentProfit: item?.currentProfit ?? 0,
      previousProfit: item?.previousProfit ?? 0,
      profitChangePercent: item?.profitChangePercent ?? 0
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
