import { DanhMucThuocApiResponse } from './danh-muc-thuoc.model';

export interface ThuocApiResponse {
  id: number;
  name: string;
  category: DanhMucThuocApiResponse;
  unit: string;
}

export interface Thuoc {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
    description?: string;
  };
  unit: string;
}
