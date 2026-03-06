export interface DanhMucThuocApiResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface DanhMucThuoc {
  id: number;
  name: string;
  description?: string;
  medicineCount: number;
}
