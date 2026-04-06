import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { MenuComponent } from '../../components/menu/menu.component';
import { PaggingComponent } from '../../components/pagging/pagging.component';
import { getErrorMessage } from '../../utils/error.util';
import { printInvoiceViaPopup } from '../../utils/invoice-print.util';
import { HoaDon, HoaDonService } from '../hoa-don/hoa-don.service';
import { NhapHang, NhapHangService } from '../nhap-hang/nhap-hang.service';
import { PopupChiTietHoaDonComponent } from './popup-chi-tiet-hoa-don/popup-chi-tiet-hoa-don.component';

interface ProcessingItem {
  importId: number;
  medicineId: number;
  medicineName: string;
  batchCode: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-danh-sach-hoa-don',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MenuComponent,
    PaggingComponent,
    PopupChiTietHoaDonComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSelectModule,
    NzTableModule,
    NzTagModule
  ],
  templateUrl: './danh-sach-hoa-don.component.html',
  styleUrl: './danh-sach-hoa-don.component.scss'
})
export class DanhSachHoaDonComponent implements OnInit {
  pageIndex = 1;
  readonly pageSize = 10;
  totalItems = 0;
  loading = false;
  viewingInvoiceId: number | null = null;
  viewDetailOpen = false;
  deletingId: number | null = null;
  deleteConfirmOpen = false;
  deletingInvoice: HoaDon | null = null;
  processingModalOpen = false;
  processingInvoiceId: number | null = null;
  processingInvoiceCode = '';
  processingCustomerId: number | null = null;
  processingCustomerName = '';
  processingItems: ProcessingItem[] = [];
  processingDiscount = 0;
  processingAmountPaid = 0;
  processingSaving = false;
  processingLoading = false;
  cancelingId: number | null = null;
  printingId: number | null = null;
  private readonly importsByMedicineId = new Map<number, NhapHang[]>();

  private readonly fb = inject(FormBuilder);
  private readonly hoaDonService = inject(HoaDonService);
  private readonly nhapHangService = inject(NhapHangService);
  private readonly notification = inject(NzNotificationService);

  readonly filterForm = this.fb.nonNullable.group({
    keyword: ['']
  });

  invoices: HoaDon[] = [];

  async ngOnInit(): Promise<void> {
    this.filterForm.controls.keyword.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 1;
        this.loadInvoices();
      });

    await this.loadInvoices();
  }

  openDeleteConfirm(invoice: HoaDon): void {
    this.deletingInvoice = invoice;
    this.deleteConfirmOpen = true;
  }

  openViewDetail(invoice: HoaDon): void {
    this.viewDetailOpen = true;
    this.viewingInvoiceId = invoice.id;
  }

  async openProcessModal(invoice: HoaDon): Promise<void> {
    if (invoice.status !== 'PENDING_PAYMENT') {
      this.notification.warning('Cảnh báo', 'Chỉ hóa đơn chờ thanh toán mới được xử lý');
      return;
    }

    this.processingModalOpen = true;
    this.processingLoading = true;
    this.processingInvoiceId = invoice.id;
    this.processingInvoiceCode = invoice.code;
    this.processingCustomerId = invoice.customerId;
    this.processingCustomerName = invoice.customerName;
    this.processingItems = [];
    this.processingDiscount = invoice.discount;
    this.processingAmountPaid = invoice.amountPaid;

    try {
      const detail = await this.hoaDonService.findById(invoice.id);
      this.processingItems = detail.items.map((item) => ({
        importId: item.importId,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        batchCode: item.batchCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));
      this.processingDiscount = detail.discount;
      this.processingCustomerId = detail.customerId;
      this.processingCustomerName = detail.customerName;
      await this.loadImportsForProcessingItems();
      this.syncProcessingAmountPaid();
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được hóa đơn để xử lý');
      this.notification.error('Thất bại', message);
      this.closeProcessModal();
    } finally {
      this.processingLoading = false;
    }
  }

  closeProcessModal(): void {
    if (this.processingSaving) {
      return;
    }
    this.processingModalOpen = false;
    this.processingInvoiceId = null;
    this.processingInvoiceCode = '';
    this.processingCustomerId = null;
    this.processingCustomerName = '';
    this.processingItems = [];
    this.processingDiscount = 0;
    this.processingAmountPaid = 0;
    this.processingLoading = false;
    this.importsByMedicineId.clear();
  }

  get processingSubtotal(): number {
    return this.processingItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  get processingTotalNeedPay(): number {
    return Math.max(this.processingSubtotal - this.processingDiscount, 0);
  }

  increaseProcessingQty(index: number): void {
    const item = this.processingItems[index];
    if (!item) {
      return;
    }
    this.processingItems[index] = { ...item, quantity: item.quantity + 1 };
    this.processingItems = [...this.processingItems];
    this.syncProcessingAmountPaid();
  }

  decreaseProcessingQty(index: number): void {
    const item = this.processingItems[index];
    if (!item || item.quantity <= 1) {
      return;
    }
    this.processingItems[index] = { ...item, quantity: item.quantity - 1 };
    this.processingItems = [...this.processingItems];
    this.syncProcessingAmountPaid();
  }

  updateProcessingQty(index: number, value: number | null): void {
    const item = this.processingItems[index];
    if (!item) {
      return;
    }
    const qty = Math.max(Number(value) || 1, 1);
    this.processingItems[index] = { ...item, quantity: qty };
    this.processingItems = [...this.processingItems];
    this.syncProcessingAmountPaid();
  }

  removeProcessingItem(index: number): void {
    this.processingItems = this.processingItems.filter((_, itemIndex) => itemIndex !== index);
    this.syncProcessingAmountPaid();
  }

  getProcessImportOptions(medicineId: number): NhapHang[] {
    return this.importsByMedicineId.get(medicineId) ?? [];
  }

  onProcessingImportChange(index: number, importId: number | null): void {
    if (!importId) {
      return;
    }
    const row = this.processingItems[index];
    if (!row) {
      return;
    }
    const options = this.getProcessImportOptions(row.medicineId);
    const selected = options.find((item) => item.id === importId);
    if (!selected) {
      return;
    }
    const unitPrice = selected.sellPrice > 0 ? selected.sellPrice : selected.importPrice;
    this.processingItems[index] = {
      ...row,
      importId: selected.id,
      batchCode: selected.batchCode,
      unitPrice
    };
    this.processingItems = [...this.processingItems];
    this.syncProcessingAmountPaid();
  }

  onProcessingDiscountChange(value: number | null): void {
    this.processingDiscount = Math.max(Number(value) || 0, 0);
    this.syncProcessingAmountPaid();
  }

  async submitProcessing(): Promise<void> {
    if (!this.processingInvoiceId) {
      return;
    }
    if (this.processingItems.length === 0) {
      this.notification.warning('Cảnh báo', 'Hóa đơn phải có ít nhất một sản phẩm');
      return;
    }
    const discount = Math.max(Number(this.processingDiscount) || 0, 0);
    const amountPaid = this.processingTotalNeedPay;

    this.processingSaving = true;
    try {
      await this.hoaDonService.update(
        this.processingInvoiceId,
        this.processingCustomerId,
        this.processingItems.map((item) => ({
          importId: item.importId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        discount,
        amountPaid
      );
      this.notification.success('Thành công', 'Đã xử lý hóa đơn thành công');
      this.closeProcessModal();
      await this.loadInvoices();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể xử lý hóa đơn. Hãy giảm số lượng hoặc chọn lại lô thuốc phù hợp.');
      this.notification.error('Thất bại', message);
    } finally {
      this.processingSaving = false;
    }
  }

  async cancelInvoice(invoice: HoaDon): Promise<void> {
    if (invoice.status !== 'PENDING_PAYMENT') {
      this.notification.warning('Cảnh báo', 'Chỉ hóa đơn chờ thanh toán mới được hủy');
      return;
    }
    this.cancelingId = invoice.id;
    try {
      await this.hoaDonService.cancel(invoice.id);
      this.notification.success('Thành công', `Đã hủy hóa đơn ${invoice.code}`);
      await this.loadInvoices();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể hủy hóa đơn');
      this.notification.error('Thất bại', message);
    } finally {
      this.cancelingId = null;
    }
  }

  async printInvoice(invoice: HoaDon): Promise<void> {
    this.printingId = invoice.id;
    try {
      const detail = await this.hoaDonService.findById(invoice.id);
      const printed = printInvoiceViaPopup(detail);
      if (!printed) {
        this.notification.warning('Cảnh báo', 'Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup để in hóa đơn.');
        return;
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể in hóa đơn');
      this.notification.error('Thất bại', message);
    } finally {
      this.printingId = null;
    }
  }

  closeViewDetail(): void {
    this.viewDetailOpen = false;
    this.viewingInvoiceId = null;
  }

  closeDeleteConfirm(force = false): void {
    if (!force && this.deletingId !== null) {
      return;
    }
    this.deleteConfirmOpen = false;
    this.deletingInvoice = null;
  }

  async confirmDelete(rollbackStock: boolean): Promise<void> {
    if (!this.deletingInvoice) {
      return;
    }

    this.deletingId = this.deletingInvoice.id;
    try {
      await this.hoaDonService.delete(this.deletingInvoice.id, rollbackStock);
      this.notification.success(
        'Thành công',
        rollbackStock ? 'Đã xóa hóa đơn và hoàn lại hàng vào kho' : 'Đã xóa hóa đơn, không hoàn lại hàng'
      );
      this.closeDeleteConfirm(true);
      await this.loadInvoices();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể xóa hóa đơn');
      this.notification.error('Thất bại', message);
      console.error('Delete hóa đơn failed', error);
    } finally {
      this.deletingId = null;
    }
  }

  async onPageChange(page: number): Promise<void> {
    this.pageIndex = page;
    await this.loadInvoices();
  }

  private async loadInvoices(): Promise<void> {
    this.loading = true;
    try {
      const pageData = await this.hoaDonService.findAll(this.pageIndex, this.pageSize, this.filterForm.controls.keyword.value);
      this.invoices = pageData.items;
      this.totalItems = pageData.totalElements;
      this.pageIndex = pageData.page;
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách hóa đơn');
      this.notification.error('Thất bại', message);
      this.invoices = [];
      this.totalItems = 0;
      console.error('Load danh sách hóa đơn failed', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadImportsForProcessingItems(): Promise<void> {
    this.importsByMedicineId.clear();
    const medicineIds = Array.from(new Set(this.processingItems.map((item) => item.medicineId)));
    await Promise.all(
      medicineIds.map(async (medicineId) => {
        const imports = await this.nhapHangService.findSaleImportsByMedicineId(medicineId);
        this.importsByMedicineId.set(medicineId, imports);
      })
    );
  }

  private syncProcessingAmountPaid(): void {
    this.processingAmountPaid = this.processingTotalNeedPay;
  }
}
