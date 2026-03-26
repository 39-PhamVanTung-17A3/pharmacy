import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { DanhMucThuocService } from '../danh-muc-thuoc/danh-muc-thuoc.service';
import { Thuoc, ThuocService } from '../thuoc/thuoc.service';
import { getErrorMessage } from '../../utils/error.util';

interface ValueItem {
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing-khach-hang',
  standalone: true,
  imports: [CommonModule, PaggingComponent],
  templateUrl: './landing-khach-hang.component.html',
  styleUrl: './landing-khach-hang.component.scss'
})
export class LandingKhachHangComponent implements OnInit {
  private readonly danhMucThuocService = inject(DanhMucThuocService);
  private readonly thuocService = inject(ThuocService);
  private readonly notification = inject(NzNotificationService);

  loadingProducts = false;
  searchKeyword = '';
  selectedCategory = 'ALL';
  pageIndex = 1;
  readonly pageSize = 8;

  medicines: Thuoc[] = [];
  categories: string[] = [];

  readonly values: ValueItem[] = [
    {
      title: 'Phân phối chính ngạch',
      description:
        'Nguồn hàng ổn định từ nhà sản xuất và nhà nhập khẩu, đầy đủ hóa đơn chứng từ cho đơn vị kinh doanh dược.'
    },
    {
      title: 'Bảng giá sỉ theo cấp đại lý',
      description:
        'Chính sách giá linh hoạt theo sản lượng, hỗ trợ nhà thuốc, phòng khám và bệnh viện tối ưu biên lợi nhuận.'
    },
    {
      title: 'Giao hàng đúng SLA',
      description:
        'Điều phối giao hàng theo tuyến và khung giờ cam kết, ưu tiên nhóm sản phẩm cần luân chuyển nhanh.'
    }
  ];

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadCategories(), this.loadAllMedicines()]);
  }

  get categoryOptions(): string[] {
    return ['ALL', ...this.categories];
  }

  get filteredProducts(): Thuoc[] {
    const keyword = this.normalizeText(this.searchKeyword.trim());
    return this.medicines.filter((item) => {
      const matchCategory = this.selectedCategory === 'ALL' || item.category.name === this.selectedCategory;
      if (!matchCategory) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const content = this.normalizeText([item.name, item.category.name, item.barcode ?? '', item.unit].join(' '));
      return content.includes(keyword);
    });
  }

  get pagedProducts(): Thuoc[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get totalShownText(): string {
    return `${this.filteredProducts.length}/${this.medicines.length} sản phẩm`;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchKeyword = input.value;
    this.pageIndex = 1;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.pageIndex = 1;
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
  }

  private async loadAllMedicines(): Promise<void> {
    this.loadingProducts = true;
    try {
      const allItems: Thuoc[] = [];
      const pageSize = 200;
      let page = 1;
      let totalPages = 1;

      do {
        const result = await this.thuocService.findAll(page, pageSize);
        allItems.push(...result.items);
        totalPages = result.totalPages || 1;
        page += 1;
      } while (page <= totalPages);

      this.medicines = allItems;
      this.pageIndex = 1;
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách sản phẩm');
      this.notification.error('Thất bại', message);
      this.medicines = [];
    } finally {
      this.loadingProducts = false;
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      const allNames: string[] = [];
      const pageSize = 200;
      let page = 1;
      let totalPages = 1;

      do {
        const result = await this.danhMucThuocService.findAll(page, pageSize);
        allNames.push(...result.items.map((item) => item.name));
        totalPages = result.totalPages || 1;
        page += 1;
      } while (page <= totalPages);

      this.categories = Array.from(new Set(allNames));
      if (this.selectedCategory !== 'ALL' && !this.categories.includes(this.selectedCategory)) {
        this.selectedCategory = 'ALL';
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh mục thuốc');
      this.notification.warning('Cảnh báo', message);
      this.categories = [];
      this.selectedCategory = 'ALL';
    }
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
