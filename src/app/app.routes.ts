import { Routes } from '@angular/router';
import { BaoCaoThongKeComponent } from './pages/bao-cao-thong-ke/bao-cao-thong-ke.component';
import { AiBaoCaoChatComponent } from './pages/ai-bao-cao-chat/ai-bao-cao-chat.component';
import { CanhBaoTonKhoComponent } from './pages/canh-bao-ton-kho/canh-bao-ton-kho.component';
import { CongNoKhachHangComponent } from './pages/cong-no-khach-hang/cong-no-khach-hang.component';
import { DanhMucThuocComponent } from './pages/danh-muc-thuoc/danh-muc-thuoc.component';
import { DanhSachHoaDonComponent } from './pages/danh-sach-hoa-don/danh-sach-hoa-don.component';
import { DoiMatKhauComponent } from './pages/doi-mat-khau/doi-mat-khau.component';
import { HoaDonComponent } from './pages/hoa-don/hoa-don.component';
import { KhachHangComponent } from './pages/khach-hang/khach-hang.component';
import { LoginComponent } from './pages/login/login.component';
import { NhanVienComponent } from './pages/nhan-vien/nhan-vien.component';
import { NhapHangComponent } from './pages/nhap-hang/nhap-hang.component';
import { ThuocComponent } from './pages/thuoc/thuoc.component';
import { authGuard, permissionGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', pathMatch: 'full', redirectTo: 'bao-cao-thong-ke' },
  { path: 'dashboard-thong-ke', pathMatch: 'full', redirectTo: 'bao-cao-thong-ke' },
  {
    path: 'bao-cao-thong-ke',
    component: BaoCaoThongKeComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_REPORT_VIEW' }
  },
  {
    path: 'tro-ly-bao-cao-ai',
    component: AiBaoCaoChatComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_REPORT_VIEW' }
  },
  {
    path: 'danh-muc-thuoc',
    component: DanhMucThuocComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_MEDICINE_MANAGE' }
  },
  {
    path: 'thuoc',
    component: ThuocComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_MEDICINE_MANAGE' }
  },
  {
    path: 'nhap-hang',
    component: NhapHangComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_IMPORT_MANAGE' }
  },
  {
    path: 'canh-bao-ton-kho',
    component: CanhBaoTonKhoComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_IMPORT_MANAGE' }
  },
  {
    path: 'khach-hang',
    component: KhachHangComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_CUSTOMER_MANAGE' }
  },
  {
    path: 'nhan-vien',
    component: NhanVienComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_EMPLOYEE_MANAGE' }
  },
  {
    path: 'danh-sach-hoa-don',
    component: DanhSachHoaDonComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_INVOICE_MANAGE' }
  },
  {
    path: 'cong-no-khach-hang',
    component: CongNoKhachHangComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_INVOICE_MANAGE' }
  },
  {
    path: 'hoa-don',
    component: HoaDonComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'PERM_INVOICE_MANAGE' }
  },
  {
    path: 'doi-mat-khau',
    component: DoiMatKhauComponent,
    canActivate: [authGuard]
  }
];
