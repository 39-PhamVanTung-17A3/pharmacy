export type CanhBaoTonKhoLoai = 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NEAR_EXPIRY' | 'EXPIRED';

export interface CanhBaoTonKhoApiResponse {
  importId: number;
  medicineId: number;
  medicineName: string;
  categoryName: string;
  batchCode: string;
  quantity: number;
  importPrice: number;
  sellPrice: number | null;
  expiryDate: string | null;
  daysToExpiry: number | null;
  supplier: string | null;
  alertType: CanhBaoTonKhoLoai;
}

export interface CanhBaoTonKho {
  importId: number;
  medicineId: number;
  medicineName: string;
  categoryName: string;
  batchCode: string;
  quantity: number;
  importPrice: number;
  sellPrice: number;
  expiryDate: string | null;
  daysToExpiry: number | null;
  supplier: string;
  alertType: CanhBaoTonKhoLoai;
}
