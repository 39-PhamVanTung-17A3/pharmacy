import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../models/base-response.model';
import { NhanVien, NhanVienApiResponse } from '../../models/nhan-vien.model';
import { PageResponse } from '../../models/page-response.model';

export type { NhanVien } from '../../models/nhan-vien.model';

@Injectable({
  providedIn: 'root'
})
export class NhanVienService {
  private readonly apiUrl = environment.beDomain + '/api/nhan-vien';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<PageResponse<NhanVien>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<PageResponse<NhanVienApiResponse>>>(this.apiUrl, { params })
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

  async create(name: string, phone: string, role: string, shift: string): Promise<NhanVien> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<NhanVienApiResponse>>(this.apiUrl, { name, phone, role, shift })
    );

    return this.mapFromApi(this.unwrapData(result));
  }

  async update(id: number, name: string, phone: string, role: string, shift: string): Promise<NhanVien> {
    const result = await firstValueFrom(
      this.http.put<BaseResponse<NhanVienApiResponse>>(`${this.apiUrl}/${id}`, { name, phone, role, shift })
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

  private mapFromApi(item: NhanVienApiResponse): NhanVien {
    return {
      id: item.id,
      name: item.name,
      phone: item.phone,
      role: item.role,
      shift: item.shift
    };
  }
}
