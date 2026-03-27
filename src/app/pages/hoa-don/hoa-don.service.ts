import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HoaDon,
  HoaDonApiResponse,
  HoaDonItem,
  HoaDonItemApiResponse,
  HoaDonItemRequest
} from '../../models/hoa-don.model';
import { BaseResponse } from '../../models/base-response.model';
import { PageResponse } from '../../models/page-response.model';

export type { HoaDon, HoaDonItemRequest } from '../../models/hoa-don.model';

@Injectable({
  providedIn: 'root'
})
export class HoaDonService {
  private readonly apiUrl = environment.beDomain + '/api/hoa-don';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<PageResponse<HoaDon>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<PageResponse<HoaDonApiResponse>>>(this.apiUrl, { params })
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

  async findById(id: number): Promise<HoaDon> {
    const result = await firstValueFrom(this.http.get<BaseResponse<HoaDonApiResponse>>(`${this.apiUrl}/${id}`));
    return this.mapFromApi(this.unwrapData(result));
  }

  async checkout(
    customerId: number | null,
    items: HoaDonItemRequest[],
    discount: number,
    amountPaid: number
  ): Promise<HoaDon> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<HoaDonApiResponse>>(`${this.apiUrl}/thanh-toan`, {
        customerId,
        items,
        discount,
        amountPaid
      })
    );
    return this.mapFromApi(this.unwrapData(result));
  }

  async create(
    customerId: number | null,
    items: HoaDonItemRequest[],
    discount: number,
    amountPaid: number,
    customerInfo?: { phone: string; name: string; address: string }
  ): Promise<HoaDon> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<HoaDonApiResponse>>(this.apiUrl, {
        customerId,
        items,
        discount,
        amountPaid,
        customerPhone: customerInfo?.phone?.trim() || undefined,
        customerName: customerInfo?.name?.trim() || undefined,
        customerAddress: customerInfo?.address?.trim() || undefined
      })
    );
    return this.mapFromApi(this.unwrapData(result));
  }

  async update(
    id: number,
    customerId: number | null,
    items: HoaDonItemRequest[],
    discount: number,
    amountPaid: number
  ): Promise<HoaDon> {
    const result = await firstValueFrom(
      this.http.put<BaseResponse<HoaDonApiResponse>>(`${this.apiUrl}/${id}`, {
        customerId,
        items,
        discount,
        amountPaid
      })
    );
    return this.mapFromApi(this.unwrapData(result));
  }

  async cancel(id: number): Promise<HoaDon> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<HoaDonApiResponse>>(`${this.apiUrl}/${id}/huy`, {})
    );
    return this.mapFromApi(this.unwrapData(result));
  }

  async delete(id: number, rollbackStock = true): Promise<void> {
    const params = new HttpParams().set('rollbackStock', rollbackStock);
    const result = await firstValueFrom(this.http.delete<BaseResponse<null>>(`${this.apiUrl}/${id}`, { params }));
    this.unwrapData(result);
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yêu cầu thất bại');
    }
    return response.data;
  }

  private mapFromApi(item: HoaDonApiResponse): HoaDon {
    return {
      id: item.id,
      code: item.code,
      customerId: item.customerId,
      customerName: item.customerName ?? 'Khách lẻ',
      saleAt: item.saleAt,
      subtotal: item.subtotal,
      discount: item.discount,
      totalNeedPay: item.totalNeedPay,
      amountPaid: item.amountPaid,
      returnAmount: item.returnAmount,
      status: item.status,
      items: item.items.map((child) => this.mapItemFromApi(child))
    };
  }

  private mapItemFromApi(item: HoaDonItemApiResponse): HoaDonItem {
    return {
      id: item.id,
      importId: item.importId,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      batchCode: item.batchCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal
    };
  }
}


