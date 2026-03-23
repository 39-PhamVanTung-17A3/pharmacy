import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiBaoCaoQueryApiResponse, AiBaoCaoQueryRequest, AiBaoCaoQueryResult } from '../../models/ai-bao-cao-chat.model';
import { BaseResponse } from '../../models/base-response.model';

@Injectable({
  providedIn: 'root'
})
export class AiBaoCaoChatService {
  private readonly apiUrl = environment.beDomain + '/api/bao-cao-thong-ke/ai-chat/query';
  private readonly http = inject(HttpClient);

  async query(request: AiBaoCaoQueryRequest): Promise<AiBaoCaoQueryResult> {
    const response = await firstValueFrom(this.http.post<BaseResponse<AiBaoCaoQueryApiResponse>>(this.apiUrl, request));
    const data = this.unwrapData(response);
    return {
      intent: data.intent,
      answer: data.answer,
      highlights: data.highlights ?? [],
      suggestedQuestions: data.suggestedQuestions ?? [],
      reportType: data.reportType,
      model: data.model,
      source: data.source
    };
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yêu cầu thất bại');
    }
    return response.data;
  }
}
