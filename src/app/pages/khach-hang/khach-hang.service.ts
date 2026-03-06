import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../models/base-response.model';
import { KhachHang, KhachHangApiResponse } from '../../models/khach-hang.model';
import { PageResponse } from '../../models/page-response.model';

export type { KhachHang } from '../../models/khach-hang.model';

@Injectable({
  providedIn: 'root'
})
export class KhachHangService {
  private readonly apiUrl = environment.beDomain + '/api/khach-hang';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<PageResponse<KhachHang>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<PageResponse<KhachHangApiResponse>>>(this.apiUrl, { params })
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

  async create(name: string, phone: string, address: string): Promise<KhachHang> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<KhachHangApiResponse>>(this.apiUrl, { name, phone, address })
    );

    return this.mapFromApi(this.unwrapData(result));
  }

  async update(id: number, name: string, phone: string, address: string): Promise<KhachHang> {
    const result = await firstValueFrom(
      this.http.put<BaseResponse<KhachHangApiResponse>>(`${this.apiUrl}/${id}`, { name, phone, address })
    );

    return this.mapFromApi(this.unwrapData(result));
  }

  async delete(id: number): Promise<void> {
    const result = await firstValueFrom(this.http.delete<BaseResponse<null>>(`${this.apiUrl}/${id}`));
    this.unwrapData(result);
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yêu cầu thất bại');
    }
    return response.data;
  }

  private mapFromApi(item: KhachHangApiResponse): KhachHang {
    return {
      id: item.id,
      name: item.name,
      phone: item.phone,
      address: item.address
    };
  }
}
