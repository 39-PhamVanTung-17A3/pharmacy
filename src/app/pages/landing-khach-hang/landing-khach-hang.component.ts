import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { DanhMucThuocService } from '../danh-muc-thuoc/danh-muc-thuoc.service';
import { Thuoc, ThuocService } from '../thuoc/thuoc.service';
import { HoaDonService } from '../hoa-don/hoa-don.service';
import { getErrorMessage } from '../../utils/error.util';

interface ValueItem {
  title: string;
  description: string;
}

interface CartItem {
  medicineId: number;
  medicineName: string;
  categoryName: string;
  unit: string;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
}

const CART_STORAGE_KEY = 'pharmacy_customer_cart_v1';

@Component({
  selector: 'app-landing-khach-hang',
  standalone: true,
  imports: [CommonModule, FormsModule, PaggingComponent],
  templateUrl: './landing-khach-hang.component.html',
  styleUrl: './landing-khach-hang.component.scss'
})
export class LandingKhachHangComponent implements OnInit {
  private readonly danhMucThuocService = inject(DanhMucThuocService);
  private readonly thuocService = inject(ThuocService);
  private readonly hoaDonService = inject(HoaDonService);
  private readonly notification = inject(NzNotificationService);

  loadingProducts = false;
  creatingInvoice = false;
  addingMedicineId: number | null = null;
  searchKeyword = '';
  selectedCategory = 'ALL';
  pageIndex = 1;
  readonly pageSize = 8;
  lastRequestedInvoiceCode: string | null = null;
  isCartPopupOpen = false;
  customerPhone = '';
  customerName = '';
  customerAddress = '';

  medicines: Thuoc[] = [];
  categories: string[] = [];
  cartItems: CartItem[] = [];
  actionMessage = '';
  actionMessageType: 'success' | 'warning' | 'error' = 'success';

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
    this.restoreCartFromStorage();
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

  get cartTotalQuantity(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
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

  trackByCartItem(_: number, item: CartItem): number {
    return item.medicineId;
  }

  openCartPopup(): void {
    this.isCartPopupOpen = true;
  }

  closeCartPopup(): void {
    this.isCartPopupOpen = false;
  }

  addToCart(medicine: Thuoc): void {
    this.addingMedicineId = medicine.id;
    try {
      if (medicine.totalQuantity <= 0) {
        this.setActionMessage(`Thuốc ${medicine.name} hiện đã hết hàng`, 'warning');
        this.notification.warning('Không thể thêm', `Thuốc ${medicine.name} hiện không còn hàng khả dụng`);
        return;
      }

      const existedIndex = this.cartItems.findIndex((item) => item.medicineId === medicine.id);
      if (existedIndex >= 0) {
        this.increaseCartQty(existedIndex);
        this.setActionMessage(`Đã tăng số lượng ${medicine.name} trong giỏ`, 'success');
        this.notification.success('Đã cập nhật giỏ hàng', `Đã tăng số lượng ${medicine.name}`);
        return;
      }

      this.cartItems = [
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          categoryName: medicine.category.name,
          unit: medicine.unit,
          imageUrl: medicine.imageUrl,
          quantity: 1,
          maxQuantity: medicine.totalQuantity
        },
        ...this.cartItems
      ];
      this.setActionMessage(`Đã thêm ${medicine.name} vào giỏ hàng`, 'success');
      this.notification.success('Đã thêm vào giỏ', `${medicine.name} đã được thêm vào giỏ hàng`);
      this.persistCartToStorage();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể thêm sản phẩm vào giỏ');
      this.setActionMessage(message, 'error');
      this.notification.error('Thất bại', message);
    } finally {
      this.addingMedicineId = null;
    }
  }

  increaseCartQty(index: number): void {
    const item = this.cartItems[index];
    if (!item) {
      return;
    }
    if (item.quantity >= item.maxQuantity) {
      this.notification.warning('Cảnh báo', 'Số lượng yêu cầu đã đạt tối đa theo lô hàng hiện có');
      return;
    }
    this.cartItems[index] = { ...item, quantity: item.quantity + 1 };
    this.cartItems = [...this.cartItems];
    this.persistCartToStorage();
  }

  decreaseCartQty(index: number): void {
    const item = this.cartItems[index];
    if (!item) {
      return;
    }
    if (item.quantity <= 1) {
      return;
    }
    this.cartItems[index] = { ...item, quantity: item.quantity - 1 };
    this.cartItems = [...this.cartItems];
    this.persistCartToStorage();
  }

  onCartQtyTyping(index: number, inputEl: HTMLInputElement): void {
    const item = this.cartItems[index];
    if (!item) {
      return;
    }

    const rawValue = inputEl.value;
    const parsedValue = Number(rawValue);
    const nextValue = Math.floor(Number.isFinite(parsedValue) ? parsedValue : 1);
    const safeValue = Math.min(Math.max(nextValue, 1), item.maxQuantity);

    if (nextValue > item.maxQuantity) {
      this.notification.warning('Cảnh báo', `Số lượng ${item.medicineName} vượt tồn kho khả dụng`);
    }

    if (Number(inputEl.value) !== safeValue) {
      inputEl.value = String(safeValue);
    }

    this.cartItems[index].quantity = safeValue;
    this.persistCartToStorage();
  }

  onCartQtyBlur(index: number, inputEl: HTMLInputElement): void {
    const item = this.cartItems[index];
    if (!item) {
      return;
    }

    const parsedValue = Number(inputEl.value);
    const normalizedQty = Math.min(
      Math.max(Math.floor(Number.isFinite(parsedValue) ? parsedValue : 1), 1),
      item.maxQuantity
    );

    if (parsedValue > item.maxQuantity) {
      this.notification.warning('Cảnh báo', `Số lượng ${item.medicineName} vượt tồn kho khả dụng`);
    }

    inputEl.value = String(normalizedQty);
    this.cartItems[index].quantity = normalizedQty;
    this.persistCartToStorage();
  }

  removeCartItem(index: number): void {
    this.cartItems = this.cartItems.filter((_, itemIndex) => itemIndex !== index);
    this.persistCartToStorage();
  }

  clearCart(): void {
    this.cartItems = [];
    this.setActionMessage('Đã xóa toàn bộ sản phẩm trong giỏ', 'warning');
    this.persistCartToStorage();
  }

  async requestCheckout(): Promise<void> {
    if (this.cartItems.length === 0) {
      this.notification.warning('Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi gửi yêu cầu thanh toán');
      return;
    }

    if (this.normalizeCartItemQuantities()) {
      this.notification.warning(
        'Cảnh báo',
        'Có sản phẩm vượt tồn kho nên hệ thống đã tự điều chỉnh số lượng. Vui lòng kiểm tra lại trước khi gửi yêu cầu.'
      );
      return;
    }

    const customerInfo = this.validateCustomerInfoForCheckout();
    if (!customerInfo) {
      return;
    }

    this.creatingInvoice = true;
    try {
      const invoice = await this.hoaDonService.create(
        null,
        this.cartItems.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: 0
        })),
        0,
        0,
        customerInfo
      );
      this.lastRequestedInvoiceCode = invoice.code;
      this.setActionMessage(`Đã tạo hóa đơn ${invoice.code} chờ nhân viên xử lý`, 'success');
      this.notification.success(
        'Đã gửi yêu cầu',
        `Yêu cầu thanh toán đã tạo hóa đơn ${invoice.code}. Nhân viên sẽ xử lý thanh toán cho bạn.`
      );
      this.cartItems = [];
      this.persistCartToStorage();
      await this.loadAllMedicines();
      this.customerPhone = '';
      this.customerName = '';
      this.customerAddress = '';
      this.closeCartPopup();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể gửi yêu cầu thanh toán');
      this.setActionMessage(message, 'error');
      this.notification.error('Thất bại', message);
    } finally {
      this.creatingInvoice = false;
    }
  }

  scrollToCart(): void {
    this.openCartPopup();
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

  private setActionMessage(message: string, type: 'success' | 'warning' | 'error'): void {
    this.actionMessage = message;
    this.actionMessageType = type;
  }

  private validateCustomerInfoForCheckout(): { phone: string; name: string; address: string } | null {
    const normalizedPhone = this.normalizePhone(this.customerPhone);
    if (!normalizedPhone) {
      this.notification.warning('Thiếu thông tin', 'Vui lòng nhập số điện thoại trước khi gửi yêu cầu thanh toán');
      return null;
    }
    const name = this.customerName.trim();
    const address = this.customerAddress.trim();
    if (!name || !address) {
      this.notification.warning('Thiếu thông tin', 'Vui lòng nhập đầy đủ họ tên và địa chỉ');
      return null;
    }
    return {
      phone: this.customerPhone.trim(),
      name,
      address
    };
  }

  private normalizePhone(value: string): string {
    return value.replace(/\D/g, '');
  }

  private normalizeCartItemQuantities(): boolean {
    let hasAdjusted = false;

    this.cartItems = this.cartItems.map((item) => {
      const normalizedQty = Math.min(Math.max(Math.floor(Number(item.quantity) || 1), 1), item.maxQuantity);
      if (normalizedQty !== item.quantity) {
        hasAdjusted = true;
        return {
          ...item,
          quantity: normalizedQty
        };
      }
      return item;
    });

    if (hasAdjusted) {
      this.persistCartToStorage();
    }

    return hasAdjusted;
  }

  private persistCartToStorage(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItems));
    } catch {
      // Ignore storage errors in private mode/quota exceeded.
    }
  }

  private restoreCartFromStorage(): void {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        this.cartItems = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.cartItems = [];
        return;
      }
      this.cartItems = parsed
        .filter((item) => item && typeof item.medicineId === 'number' && typeof item.quantity === 'number')
        .map((item) => ({
          medicineId: Number(item.medicineId),
          medicineName: String(item.medicineName ?? ''),
          categoryName: String(item.categoryName ?? ''),
          unit: String(item.unit ?? ''),
          imageUrl: item.imageUrl ? String(item.imageUrl) : null,
          quantity: Math.max(1, Number(item.quantity) || 1),
          maxQuantity: Math.max(1, Number(item.maxQuantity) || 1)
        }));
    } catch {
      this.cartItems = [];
    }
  }
}


