import { NhanVienRole } from './role.enum';

export interface NhanVienApiResponse {
  id: number;
  name: string;
  phone: string;
  role: NhanVienRole;
  shift: string;
}

export interface NhanVien {
  id: number;
  name: string;
  phone: string;
  role: NhanVienRole;
  shift: string;
}
