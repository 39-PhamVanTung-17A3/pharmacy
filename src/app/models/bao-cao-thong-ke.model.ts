export type BaoCaoReportType = 'DAY' | 'MONTH' | 'QUARTER' | 'YEAR';

export interface BaoCaoThongKeRowApiResponse {
  periodLabel: string;
  invoiceCount: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface BaoCaoThongKeKpiApiResponse {
  totalInvoiceCount: number;
  totalSoldQuantity: number;
  grossRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  averageOrderValue: number;
  inventoryValue: number;
  lowStockCount: number;
  expiringWithin90DaysCount: number;
}

export interface BaoCaoMedicineRankingApiResponse {
  medicineName: string;
  categoryName: string;
  soldQuantity: number;
  revenue: number;
}

export interface BaoCaoStockAlertApiResponse {
  medicineName: string;
  categoryName: string;
  batchCode: string;
  quantity: number;
  inventoryValue: number;
  expiryDate: string | null;
  daysToExpiry: number | null;
  supplier: string | null;
}

export interface BaoCaoCategoryRevenueApiResponse {
  categoryName: string;
  soldQuantity: number;
  revenue: number;
}

export interface BaoCaoHourRevenueApiResponse {
  hourLabel: string;
  invoiceCount: number;
  revenue: number;
}

export interface BaoCaoTopCustomerApiResponse {
  customerLabel: string;
  phone: string | null;
  invoiceCount: number;
  revenue: number;
  profit: number;
}

export interface BaoCaoCustomerTypeRevenueApiResponse {
  customerType: string;
  invoiceCount: number;
  revenue: number;
}

export interface BaoCaoCustomerPeriodRevenueApiResponse {
  periodLabel: string;
  retailInvoiceCount: number;
  retailRevenue: number;
  knownInvoiceCount: number;
  knownRevenue: number;
}

export interface BaoCaoComparisonApiResponse {
  currentPeriodLabel: string | null;
  previousPeriodLabel: string | null;
  currentInvoiceCount: number;
  previousInvoiceCount: number;
  currentRevenue: number;
  previousRevenue: number;
  revenueChangePercent: number;
  currentProfit: number;
  previousProfit: number;
  profitChangePercent: number;
}

export interface BaoCaoThongKeApiResponse {
  type: BaoCaoReportType;
  rows: BaoCaoThongKeRowApiResponse[];
  kpi: BaoCaoThongKeKpiApiResponse;
  topSellingMedicines: BaoCaoMedicineRankingApiResponse[];
  slowSellingMedicines: BaoCaoMedicineRankingApiResponse[];
  lowStockMedicines: BaoCaoStockAlertApiResponse[];
  expiringMedicines: BaoCaoStockAlertApiResponse[];
  categoryRevenue: BaoCaoCategoryRevenueApiResponse[];
  hourlyRevenue: BaoCaoHourRevenueApiResponse[];
  topCustomers: BaoCaoTopCustomerApiResponse[];
  customerTypeRevenue: BaoCaoCustomerTypeRevenueApiResponse[];
  customerPeriodRevenue: BaoCaoCustomerPeriodRevenueApiResponse[];
  comparison: BaoCaoComparisonApiResponse;
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
  kpi: BaoCaoThongKeKpiApiResponse;
  topSellingMedicines: BaoCaoMedicineRankingApiResponse[];
  slowSellingMedicines: BaoCaoMedicineRankingApiResponse[];
  lowStockMedicines: BaoCaoStockAlertApiResponse[];
  expiringMedicines: BaoCaoStockAlertApiResponse[];
  categoryRevenue: BaoCaoCategoryRevenueApiResponse[];
  hourlyRevenue: BaoCaoHourRevenueApiResponse[];
  topCustomers: BaoCaoTopCustomerApiResponse[];
  customerTypeRevenue: BaoCaoCustomerTypeRevenueApiResponse[];
  customerPeriodRevenue: BaoCaoCustomerPeriodRevenueApiResponse[];
  comparison: BaoCaoComparisonApiResponse;
}
