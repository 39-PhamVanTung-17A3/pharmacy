import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface LandingFeature {
  title: string;
  description: string;
  tag: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly highlights: string[] = ['Theo dõi tồn kho theo lô', 'Cảnh báo sớm hết hạn', 'Báo cáo kinh doanh tức thời'];

  readonly features: LandingFeature[] = [
    {
      tag: 'Kho thuốc',
      title: 'Quản lý tồn kho theo lô và hạn dùng',
      description: 'Kiểm soát số lượng, ngày nhập, hạn dùng và nhà cung cấp cho từng lô thuốc trong một màn hình.'
    },
    {
      tag: 'Bán hàng',
      title: 'Vận hành hóa đơn và công nợ tập trung',
      description: 'Tạo hóa đơn nhanh, theo dõi thanh toán còn thiếu và đối soát công nợ khách hàng theo thời gian thực.'
    },
    {
      tag: 'Báo cáo',
      title: 'Phân tích doanh thu, lợi nhuận và top sản phẩm',
      description: 'Quan sát ngay KPI quản trị kinh doanh, biểu đồ theo kỳ và xu hướng tiêu thụ thuốc bán chạy.'
    }
  ];

  get primaryLabel(): string {
    return this.authService.isLoggedIn() ? 'Vào báo cáo thống kê' : 'Đăng nhập hệ thống';
  }

  async goPrimary(): Promise<void> {
    const target = this.authService.isLoggedIn() ? '/bao-cao-thong-ke' : '/login';
    await this.router.navigateByUrl(target);
  }
}
