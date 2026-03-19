import { Routes } from '@angular/router';
import { DanhSachHoaDonComponent } from './pages/danh-sach-hoa-don/danh-sach-hoa-don.component';
import { BaoCaoThongKeComponent } from './pages/bao-cao-thong-ke/bao-cao-thong-ke.component';
import { DanhMucThuocComponent } from './pages/danh-muc-thuoc/danh-muc-thuoc.component';
import { HoaDonComponent } from './pages/hoa-don/hoa-don.component';
import { KhachHangComponent } from './pages/khach-hang/khach-hang.component';
import { NhapHangComponent } from './pages/nhap-hang/nhap-hang.component';
import { NhanVienComponent } from './pages/nhan-vien/nhan-vien.component';
import { ThuocComponent } from './pages/thuoc/thuoc.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bao-cao-thong-ke' },
  { path: 'dashboard-thong-ke', pathMatch: 'full', redirectTo: 'bao-cao-thong-ke' },
  { path: 'bao-cao-thong-ke', component: BaoCaoThongKeComponent },
  { path: 'danh-muc-thuoc', component: DanhMucThuocComponent },
  { path: 'thuoc', component: ThuocComponent },
  { path: 'nhap-hang', component: NhapHangComponent },
  { path: 'khach-hang', component: KhachHangComponent },
  { path: 'nhan-vien', component: NhanVienComponent },
  { path: 'danh-sach-hoa-don', component: DanhSachHoaDonComponent },
  { path: 'hoa-don', component: HoaDonComponent }
];
