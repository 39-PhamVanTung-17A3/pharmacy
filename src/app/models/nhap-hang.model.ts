export interface NhapHangApiResponse {
  id: number;
  medicineId: number;
  medicineName: string;
  batchCode: string;
  supplier: string | null;
  quantity: number;
  importPrice: number;
  sellPrice: number | null;
  expiryDate: string;
  importedAt: string;
}

export interface NhapHang {
  id: number;
  medicineId: number;
  medicineName: string;
  batchCode: string;
  supplier: string;
  quantity: number;
  importPrice: number;
  sellPrice: number;
  expiryDate: string;
  importedAt: string;
}
