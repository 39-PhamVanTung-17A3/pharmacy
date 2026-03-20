import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../models/base-response.model';
import { CongNoKhachHang, CongNoKhachHangApiResponse } from '../../models/cong-no-khach-hang.model';
import { PageResponse } from '../../models/page-response.model';

export type { CongNoKhachHang } from '../../models/cong-no-khach-hang.model';

@Injectable({
  providedIn: 'root'
})
export class CongNoKhachHangService {
  private readonly apiUrl = environment.beDomain + '/api/hoa-don/cong-no-khach-hang';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<PageResponse<CongNoKhachHang>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<PageResponse<CongNoKhachHangApiResponse>>>(this.apiUrl, { params })
    );

    const data = this.unwrapData(result);
    return {
      items: data.items.map((item) => this.mapFromApi(item)),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      page: data.page,
      size: data.size
    };
  }

  async collectDebt(customerId: number, amount: number): Promise<CongNoKhachHang> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<CongNoKhachHangApiResponse>>(`${this.apiUrl}/${customerId}/thu-no`, { amount })
    );
    return this.mapFromApi(this.unwrapData(result));
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yêu cầu thất bại');
    }
    return response.data;
  }

  private mapFromApi(item: CongNoKhachHangApiResponse): CongNoKhachHang {
    return {
      customerId: item.customerId,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      totalNeedPay: item.totalNeedPay,
      totalPaid: item.totalPaid,
      totalDebt: item.totalDebt,
      invoiceCount: item.invoiceCount,
      lastSaleAt: item.lastSaleAt
    };
  }
}
