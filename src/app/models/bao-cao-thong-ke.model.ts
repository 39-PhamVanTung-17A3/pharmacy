export type BaoCaoReportType = 'MONTH' | 'QUARTER' | 'YEAR';

export interface BaoCaoThongKeRowApiResponse {
  periodLabel: string;
  invoiceCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface BaoCaoThongKeApiResponse {
  type: BaoCaoReportType;
  rows: BaoCaoThongKeRowApiResponse[];
}

export interface BaoCaoThongKeRow {
  periodLabel: string;
  invoiceCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface BaoCaoThongKeSummary {
  type: BaoCaoReportType;
  rows: BaoCaoThongKeRow[];
}
