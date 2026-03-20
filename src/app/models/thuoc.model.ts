import { DanhMucThuocApiResponse } from './danh-muc-thuoc.model';

export interface ThuocApiResponse {
  id: number;
  name: string;
  category: DanhMucThuocApiResponse;
  barcode: string | null;
  unit: string;
  totalQuantity: number;
}

export interface Thuoc {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
    description?: string;
  };
  barcode: string | null;
  unit: string;
  totalQuantity: number;
}
