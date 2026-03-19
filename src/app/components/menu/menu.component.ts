import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { ROLE_LABELS, parseNhanVienRole } from '../../models/role.enum';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  label: string;
  route?: string;
  icon: string;
  permission?: string;
  isAction?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NzLayoutModule, NzIconModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  private readonly authService = inject(AuthService);

  readonly sections: MenuSection[] = [
    {
      title: 'Tổng quan',
      items: [{ label: 'Báo cáo thống kê', route: '/bao-cao-thong-ke', icon: 'line-chart', permission: 'PERM_REPORT_VIEW' }]
    },
    {
      title: 'Kho thuốc',
      items: [
        { label: 'Danh mục thuốc', route: '/danh-muc-thuoc', icon: 'appstore', permission: 'PERM_MEDICINE_MANAGE' },
        { label: 'Kho thuốc', route: '/thuoc', icon: 'medicine-box', permission: 'PERM_MEDICINE_MANAGE' },
        { label: 'Nhập hàng', route: '/nhap-hang', icon: 'inbox', permission: 'PERM_IMPORT_MANAGE' }
      ]
    },
    {
      title: 'Bán hàng',
      items: [
        { label: 'Khách hàng', route: '/khach-hang', icon: 'team', permission: 'PERM_CUSTOMER_MANAGE' },
        { label: 'Tạo hóa đơn', route: '/hoa-don', icon: 'file-add', permission: 'PERM_INVOICE_MANAGE' },
        { label: 'Danh sách hóa đơn', route: '/danh-sach-hoa-don', icon: 'file-text', permission: 'PERM_INVOICE_MANAGE' }
      ]
    },
    {
      title: 'Hệ thống',
      items: [
        { label: 'Nhân viên', route: '/nhan-vien', icon: 'idcard', permission: 'PERM_EMPLOYEE_MANAGE' },
        { label: 'Đổi mật khẩu', route: '/doi-mat-khau', icon: 'lock' },
        { label: 'Đăng xuất', icon: 'logout', isAction: true }
      ]
    }
  ];

  get session() {
    return this.authService.session;
  }

  get displayName(): string {
    return this.session?.name || 'Nhân viên';
  }

  get initials(): string {
    const words = this.displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return words.slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'NV';
  }

  get roleLabel(): string {
    const parsedRole = parseNhanVienRole(this.session?.role);
    return parsedRole ? ROLE_LABELS[parsedRole] : this.session?.role || '-';
  }

  can(permission?: string): boolean {
    if (!permission) {
      return true;
    }
    return this.authService.hasPermission(permission);
  }

  sectionVisible(section: MenuSection): boolean {
    return section.items.some((item) => this.can(item.permission));
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
