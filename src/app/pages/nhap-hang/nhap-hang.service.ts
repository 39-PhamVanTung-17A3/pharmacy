import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../../models/base-response.model';
import {
  NhapHang,
  NhapHangApiResponse,
  NhapHangSaleTree,
  NhapHangSaleTreeApiResponse,
  NhapHangSaleTreeNode,
  NhapHangSaleTreeNodeApiResponse
} from '../../models/nhap-hang.model';
import { PageResponse } from '../../models/page-response.model';

export type { NhapHang } from '../../models/nhap-hang.model';

@Injectable({
  providedIn: 'root'
})
export class NhapHangService {
  private readonly apiUrl = environment.beDomain + '/api/nhap-hang';
  private readonly http = inject(HttpClient);

  async findAll(page: number, size: number, keyword?: string): Promise<PageResponse<NhapHang>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<PageResponse<NhapHangApiResponse>>>(this.apiUrl, { params })
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

  async findSaleTree(): Promise<NhapHangSaleTree> {
    const result = await firstValueFrom(
      this.http.get<BaseResponse<NhapHangSaleTreeApiResponse>>(`${this.apiUrl}/sale-tree`)
    );

    const data = this.unwrapData(result);
    return {
      treeNodes: data.treeNodes.map((node) => this.mapSaleTreeNodeFromApi(node)),
      imports: data.imports.map((item) => this.mapFromApi(item))
    };
  }

  async findSaleImportsByMedicineId(medicineId: number): Promise<NhapHang[]> {
    const params = new HttpParams().set('medicineId', medicineId);
    const result = await firstValueFrom(
      this.http.get<BaseResponse<NhapHangApiResponse[]>>(`${this.apiUrl}/sale-imports`, { params })
    );
    return this.unwrapData(result)
      .map((item) => this.mapFromApi(item))
      .filter((item) => item.quantity > 0);
  }

  async create(
    medicineId: number,
    batchCode: string,
    supplier: string,
    quantity: number,
    importPrice: number,
    sellPrice: number,
    expiryDate: string,
    importedAt: string
  ): Promise<NhapHang> {
    const result = await firstValueFrom(
      this.http.post<BaseResponse<NhapHangApiResponse>>(this.apiUrl, {
        medicineId,
        batchCode,
        supplier,
        quantity,
        importPrice,
        sellPrice,
        expiryDate,
        importedAt
      })
    );

    return this.mapFromApi(this.unwrapData(result));
  }

  async update(
    id: number,
    medicineId: number,
    batchCode: string,
    supplier: string,
    quantity: number,
    importPrice: number,
    sellPrice: number,
    expiryDate: string,
    importedAt: string
  ): Promise<NhapHang> {
    const result = await firstValueFrom(
      this.http.put<BaseResponse<NhapHangApiResponse>>(`${this.apiUrl}/${id}`, {
        medicineId,
        batchCode,
        supplier,
        quantity,
        importPrice,
        sellPrice,
        expiryDate,
        importedAt
      })
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

  private mapFromApi(item: NhapHangApiResponse): NhapHang {
    return {
      id: item.id,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      batchCode: item.batchCode,
      supplier: item.supplier ?? '',
      quantity: item.quantity,
      importPrice: item.importPrice,
      sellPrice: item.sellPrice ?? 0,
      expiryDate: item.expiryDate,
      importedAt: item.importedAt
    };
  }

  private mapSaleTreeNodeFromApi(item: NhapHangSaleTreeNodeApiResponse): NhapHangSaleTreeNode {
    return {
      title: item.title,
      key: item.key,
      selectable: item.selectable,
      disabled: item.disabled,
      isLeaf: item.isLeaf,
      children: (item.children ?? []).map((child) => this.mapSaleTreeNodeFromApi(child))
    };
  }
}
