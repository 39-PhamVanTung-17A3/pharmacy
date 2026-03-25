import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../models/base-response.model';
import { PageResponse } from '../../models/page-response.model';
import { Thuoc, ThuocApiResponse } from '../../models/thuoc.model';

export type { Thuoc } from '../../models/thuoc.model';

@Injectable({
  providedIn: 'root'
})
export class ThuocService {
  private readonly apiUrl = environment.beDomain + '/api/thuoc';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<PageResponse<Thuoc>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(this.http.get<BaseResponse<PageResponse<ThuocApiResponse>>>(this.apiUrl, { params }));
    const data = this.unwrapData(result);

    return {
      items: data.items.map((item) => this.mapFromApi(item)),
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      page: data.page,
      size: data.size
    };
  }

  async findByBarcode(barcode: string): Promise<Thuoc> {
    const normalizedBarcode = barcode.trim();
    const result = await firstValueFrom(
      this.http.get<BaseResponse<ThuocApiResponse>>(`${this.apiUrl}/barcode/${encodeURIComponent(normalizedBarcode)}`)
    );
    return this.mapFromApi(this.unwrapData(result));
  }

  async create(name: string, categoryId: number, barcode: string | null, unit: string, imageFile?: File | null): Promise<Thuoc> {
    const payload = this.buildMedicineFormData(name, categoryId, barcode, unit, imageFile);
    const result = await firstValueFrom(this.http.post<BaseResponse<ThuocApiResponse>>(this.apiUrl, payload));
    return this.mapFromApi(this.unwrapData(result));
  }

  async update(
    id: number,
    name: string,
    categoryId: number,
    barcode: string | null,
    unit: string,
    imageFile?: File | null
  ): Promise<Thuoc> {
    const payload = this.buildMedicineFormData(name, categoryId, barcode, unit, imageFile);
    const result = await firstValueFrom(
      this.http.put<BaseResponse<ThuocApiResponse>>(`${this.apiUrl}/${id}`, payload)
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

  private mapFromApi(item: ThuocApiResponse): Thuoc {
    return {
      id: item.id,
      name: item.name,
      category: {
        id: item.category.id,
        name: item.category.name,
        description: item.category.description?.trim() || undefined
      },
      barcode: item.barcode ?? null,
      unit: item.unit,
      imageUrl: this.resolveImageUrl(item.imageUrl),
      totalQuantity: item.totalQuantity ?? 0
    };
  }

  private buildMedicineFormData(
    name: string,
    categoryId: number,
    barcode: string | null,
    unit: string,
    imageFile?: File | null
  ): FormData {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('categoryId', String(categoryId));
    formData.append('barcode', barcode ?? '');
    formData.append('unit', unit);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return formData;
  }

  private resolveImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl?.trim()) {
      return null;
    }
    const normalized = imageUrl.trim();
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }
    if (normalized.startsWith('/')) {
      return `${environment.beDomain}${normalized}`;
    }
    return `${environment.beDomain}/${normalized}`;
  }
}
