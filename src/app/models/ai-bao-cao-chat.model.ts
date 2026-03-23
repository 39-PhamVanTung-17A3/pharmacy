export type AiBaoCaoReportType = 'AUTO' | 'DAY' | 'MONTH' | 'QUARTER' | 'YEAR';

export interface AiBaoCaoQueryRequest {
  question: string;
  reportType?: AiBaoCaoReportType;
  fromDate?: string;
  toDate?: string;
}

export interface AiBaoCaoQueryApiResponse {
  intent: string;
  answer: string;
  highlights: string[];
  suggestedQuestions: string[];
  reportType: string;
  model: string;
  source: string;
}

export interface AiBaoCaoQueryResult {
  intent: string;
  answer: string;
  highlights: string[];
  suggestedQuestions: string[];
  reportType: string;
  model: string;
  source: string;
}
