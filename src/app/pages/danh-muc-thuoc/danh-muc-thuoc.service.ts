import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseResponse } from '../../models/base-response.model';
import { DanhMucThuoc, DanhMucThuocApiResponse } from '../../models/danh-muc-thuoc.model';
import { PageResponse } from '../../models/page-response.model';
import { environment } from '../../../environments/environment';

export type { DanhMucThuoc } from '../../models/danh-muc-thuoc.model';

@Injectable({
  providedIn: 'root'
})
export class DanhMucThuocService {
  private readonly apiUrl = environment.beDomain + '/api/danh-muc-thuoc';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<PageResponse<DanhMucThuoc>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<PageResponse<DanhMucThuocApiResponse>>>(this.apiUrl, { params })
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

  async create(name: string, description: string): Promise<DanhMucThuoc> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<DanhMucThuocApiResponse>>(this.apiUrl, { name, description })
    );

    const data = this.unwrapData(result);
    return this.mapFromApi(data);
  }

  async update(id: number, name: string, description: string): Promise<DanhMucThuoc> {
    const result = await firstValueFrom(
      this.http.put<BaseResponse<DanhMucThuocApiResponse>>(`${this.apiUrl}/${id}`, { name, description })
    );

    const data = this.unwrapData(result);
    return this.mapFromApi(data);
  }

  async delete(id: number): Promise<void> {
    const result = await firstValueFrom(this.http.delete<BaseResponse<null>>(`${this.apiUrl}/${id}`));
    this.unwrapData(result);
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yeu cau that bai');
    }
    return response.data;
  }

  private mapFromApi(item: DanhMucThuocApiResponse): DanhMucThuoc {
    return {
      id: item.id,
      name: item.name,
      description: item.description?.trim(),
      medicineCount: 0
    };
  }
}
