export interface HoaDonItemApiResponse {
  id: number;
  importId: number;
  medicineId: number;
  medicineName: string;
  batchCode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface HoaDonApiResponse {
  id: number;
  code: string;
  customerId: number | null;
  customerName: string | null;
  saleAt: string;
  subtotal: number;
  discount: number;
  totalNeedPay: number;
  amountPaid: number;
  returnAmount: number;
  items: HoaDonItemApiResponse[];
}

export interface HoaDonItem {
  id: number;
  importId: number;
  medicineId: number;
  medicineName: string;
  batchCode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface HoaDon {
  id: number;
  code: string;
  customerId: number | null;
  customerName: string;
  saleAt: string;
  subtotal: number;
  discount: number;
  totalNeedPay: number;
  amountPaid: number;
  returnAmount: number;
  items: HoaDonItem[];
}

export interface HoaDonItemRequest {
  importId: number;
  quantity: number;
  unitPrice: number;
}
