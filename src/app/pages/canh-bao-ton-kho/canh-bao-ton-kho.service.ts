import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiTonKhoGoiY, AiTonKhoGoiYApiResponse, AiTonKhoGoiYRequest } from '../../models/ai-ton-kho.model';
import { BaseResponse } from '../../models/base-response.model';
import { CanhBaoTonKho, CanhBaoTonKhoApiResponse, CanhBaoTonKhoLoai } from '../../models/canh-bao-ton-kho.model';
import { PageResponse } from '../../models/page-response.model';

export type { CanhBaoTonKho, CanhBaoTonKhoLoai } from '../../models/canh-bao-ton-kho.model';

@Injectable({
  providedIn: 'root'
})
export class CanhBaoTonKhoService {
  private readonly apiUrl = environment.beDomain + '/api/nhap-hang/canh-bao-ton-kho';
  private readonly aiApiUrl = environment.beDomain + '/api/nhap-hang/canh-bao-ton-kho/ai-goi-y';
  private readonly http = inject(HttpClient);

  async findAll(
    page: number,
    size: number,
    keyword?: string,
    alertType: CanhBaoTonKhoLoai = 'ALL'
  ): Promise<PageResponse<CanhBaoTonKho>> {
    let params = new HttpParams().set('page', page).set('size', size).set('alertType', alertType);
    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    const result = await firstValueFrom(
      this.http.get<BaseResponse<PageResponse<CanhBaoTonKhoApiResponse>>>(this.apiUrl, { params })
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

  async generateAiSuggestion(note?: string): Promise<AiTonKhoGoiY> {
    const body: AiTonKhoGoiYRequest = {
      note: note?.trim() || undefined,
      sampleSize: 30
    };

    const result = await firstValueFrom(
      this.http.post<BaseResponse<AiTonKhoGoiYApiResponse>>(this.aiApiUrl, body)
    );
    const data = this.unwrapData(result);
    return this.mapAiSuggestionFromApi(data);
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yêu cầu thất bại');
    }
    return response.data;
  }

  private mapFromApi(item: CanhBaoTonKhoApiResponse): CanhBaoTonKho {
    return {
      importId: item.importId,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      categoryName: item.categoryName,
      batchCode: item.batchCode,
      quantity: item.quantity,
      importPrice: item.importPrice,
      sellPrice: item.sellPrice ?? 0,
      expiryDate: item.expiryDate,
      daysToExpiry: item.daysToExpiry,
      supplier: item.supplier ?? '',
      alertType: item.alertType
    };
  }

  private mapAiSuggestionFromApi(item: AiTonKhoGoiYApiResponse): AiTonKhoGoiY {
    return {
      tongSoCanhBao: item.tongSoCanhBao,
      soLuongSapHetHang: item.soLuongSapHetHang,
      soLuongSapHetHan: item.soLuongSapHetHan,
      soLuongDaHetHan: item.soLuongDaHetHan,
      tomTat: item.tomTat,
      hanhDongUuTien: item.hanhDongUuTien ?? [],
      moHinhSuDung: item.moHinhSuDung,
      nguonSinhNoiDung: item.nguonSinhNoiDung
    };
  }
}
