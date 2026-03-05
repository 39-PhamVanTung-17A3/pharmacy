import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BaseResponse } from '../../models/base-response.model';
import { environment } from '../../../environments/environment';

interface DanhMucThuocApiResponse {
  id: number;
  name: string;
  description: string | null;
}

interface DanhMucThuocPageApiResponse {
  items: DanhMucThuocApiResponse[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface DanhMucThuoc {
  id: number;
  name: string;
  description?: string;
  medicineCount: number;
}

export interface DanhMucThuocPage {
  items: DanhMucThuoc[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class DanhMucThuocService {
  private readonly apiUrl = environment.beDomain + '/api/danh-muc-thuoc';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<DanhMucThuocPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<DanhMucThuocPageApiResponse>>(this.apiUrl, { params })
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
