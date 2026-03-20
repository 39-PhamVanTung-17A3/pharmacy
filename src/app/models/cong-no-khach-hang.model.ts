export interface CongNoKhachHangApiResponse {
  customerId: number;
  customerName: string;
  customerPhone: string;
  totalNeedPay: number;
  totalPaid: number;
  totalDebt: number;
  invoiceCount: number;
  lastSaleAt: string | null;
}

export interface CongNoKhachHang {
  customerId: number;
  customerName: string;
  customerPhone: string;
  totalNeedPay: number;
  totalPaid: number;
  totalDebt: number;
  invoiceCount: number;
  lastSaleAt: string | null;
}
