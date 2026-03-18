import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { MenuComponent } from '../../components/menu/menu.component';
import { getErrorMessage } from '../../utils/error.util';
import { KhachHang, KhachHangService } from '../khach-hang/khach-hang.service';
import { PopupKhachHangComponent } from '../khach-hang/popup-khach-hang/popup-khach-hang.component';
import { NhapHang, NhapHangService } from '../nhap-hang/nhap-hang.service';
import { Thuoc, ThuocService } from '../thuoc/thuoc.service';
import { HoaDonItemRequest, HoaDonService } from './hoa-don.service';

interface BillItem {
  importId: number;
  name: string;
  stockLabel: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

@Component({
  selector: 'app-hoa-don',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MenuComponent,
    PopupKhachHangComponent,
    NzBreadCrumbModule,
    NzButtonModule,
    NzCardModule,
    NzDividerModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTreeSelectModule
  ],
  templateUrl: './hoa-don.component.html',
  styleUrl: './hoa-don.component.scss'
})
export class HoaDonComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly nhapHangService = inject(NhapHangService);
  private readonly thuocService = inject(ThuocService);
  private readonly khachHangService = inject(KhachHangService);
  private readonly hoaDonService = inject(HoaDonService);
  private readonly notification = inject(NzNotificationService);

  readonly saleForm = this.fb.group({
    selectedImportKey: this.fb.control<string | null>(null)
  });

  readonly customerForm = this.fb.group({
    customerId: this.fb.control<number | null>(null),
    phone: this.fb.nonNullable.control('')
  });

  readonly paymentForm = this.fb.nonNullable.group({
    discount: [0],
    amountPaid: [0]
  });

  medicineImportTreeNodes: NzTreeNodeOptions[] = [];
  importOptionsById = new Map<number, NhapHang>();
  loadedMedicineNodeKeys = new Set<string>();
  loadingMedicineNodeKeys = new Set<string>();
  loadingMedicineTree = false;

  customerOptions: KhachHang[] = [];
  loadingCustomers = false;
  customerPopupOpen = false;
  checkoutLoading = false;
  currentInvoiceCode = 'Tự động';

  billItems: BillItem[] = [];

  async ngOnInit(): Promise<void> {
    this.customerForm.controls.customerId.valueChanges.subscribe((customerId) => {
      this.onCustomerChange(customerId);
    });

    this.paymentForm.controls.discount.valueChanges.subscribe(() => {
      this.syncAmountPaidWithTotalNeedPay();
    });

    this.saleForm.controls.selectedImportKey.valueChanges.subscribe((selectedKey) => {
      this.onImportOrderSelected(selectedKey);
    });

    await Promise.all([this.loadCustomers(), this.loadMedicineTreeByMedicine()]);
  }

  get subtotal(): number {
    return this.billItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get discount(): number {
    return Number(this.paymentForm.controls.discount.value) || 0;
  }

  get totalNeedPay(): number {
    return Math.max(this.subtotal - this.discount, 0);
  }

  get amountPaid(): number {
    return Number(this.paymentForm.controls.amountPaid.value) || 0;
  }

  get returnAmount(): number {
    return this.amountPaid - this.totalNeedPay;
  }

  increaseQty(index: number): void {
    if (this.billItems[index].quantity >= this.billItems[index].maxQuantity) {
      this.notification.warning('Cảnh báo', 'Số lượng bán vượt quá tồn kho của lô nhập');
      return;
    }
    this.billItems[index].quantity += 1;
    this.billItems = [...this.billItems];
    this.syncAmountPaidWithTotalNeedPay();
  }

  decreaseQty(index: number): void {
    if (this.billItems[index].quantity <= 1) {
      return;
    }
    this.billItems[index].quantity -= 1;
    this.billItems = [...this.billItems];
    this.syncAmountPaidWithTotalNeedPay();
  }

  updatePrice(index: number, value: number | null): void {
    const nextValue = Math.max(Number(value) || 0, 0);
    this.billItems[index].price = nextValue;
    this.billItems = [...this.billItems];
    this.syncAmountPaidWithTotalNeedPay();
  }

  removeItem(index: number): void {
    this.billItems = this.billItems.filter((_, itemIndex) => itemIndex !== index);
    this.syncAmountPaidWithTotalNeedPay();
  }

  clearBill(): void {
    this.billItems = [];
    this.syncAmountPaidWithTotalNeedPay();
  }

  async submitCheckout(): Promise<void> {
    if (this.billItems.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng thêm ít nhất một sản phẩm để thanh toán');
      return;
    }
    if (this.amountPaid < this.totalNeedPay) {
      this.notification.warning('Cảnh báo', 'Tiền khách đưa chưa đủ để thanh toán');
      return;
    }

    const items: HoaDonItemRequest[] = this.billItems.map((item) => ({
      importId: item.importId,
      quantity: item.quantity,
      unitPrice: item.price
    }));

    this.checkoutLoading = true;
    try {
      const savedInvoice = await this.hoaDonService.checkout(
        this.customerForm.controls.customerId.value ?? null,
        items,
        this.discount,
        this.amountPaid
      );

      this.currentInvoiceCode = savedInvoice.code;
      this.notification.success('Thành công', `Thanh toán hóa đơn ${savedInvoice.code} thành công`);

      this.clearBill();
      this.paymentForm.patchValue({
        discount: 0,
        amountPaid: 0
      });
      this.saleForm.patchValue({
        selectedImportKey: null
      });

      await this.loadMedicineTreeByMedicine();
    } catch (error) {
      const message = getErrorMessage(error, 'Không thể thanh toán hóa đơn');
      this.notification.error('Thất bại', message);
      console.error('Checkout hóa đơn failed', error);
    } finally {
      this.checkoutLoading = false;
    }
  }

  onCustomerChange(customerId: number | null): void {
    const selected = this.customerOptions.find((item) => item.id === customerId);
    this.customerForm.patchValue({
      phone: selected?.phone ?? ''
    });
  }

  openCreateCustomerPopup(): void {
    this.customerPopupOpen = true;
  }

  closeCustomerPopup(): void {
    this.customerPopupOpen = false;
  }

  async onCustomerSaved(saved: KhachHang): Promise<void> {
    this.customerPopupOpen = false;
    await this.loadCustomers();
    this.customerForm.patchValue({
      customerId: saved.id,
      phone: saved.phone
    });
  }

  private onImportOrderSelected(selectedKey: string | null): void {
    if (!selectedKey || !selectedKey.startsWith('import-')) {
      return;
    }

    const importId = Number(selectedKey.replace('import-', ''));
    const selectedImport = this.importOptionsById.get(importId);
    if (!selectedImport) {
      return;
    }

    const existedIndex = this.billItems.findIndex((item) => item.importId === selectedImport.id);
    if (existedIndex >= 0) {
      this.increaseQty(existedIndex);
      this.saleForm.controls.selectedImportKey.setValue(null, { emitEvent: false });
      return;
    }

    const defaultPrice = selectedImport.sellPrice > 0 ? selectedImport.sellPrice : selectedImport.importPrice;
    const newItem: BillItem = {
      importId: selectedImport.id,
      name: selectedImport.medicineName,
      stockLabel: `Lô: ${selectedImport.batchCode} - Tồn kho: ${selectedImport.quantity}`,
      price: defaultPrice,
      quantity: 1,
      maxQuantity: selectedImport.quantity
    };

    this.billItems = [newItem, ...this.billItems];
    this.saleForm.controls.selectedImportKey.setValue(null, { emitEvent: false });
    this.syncAmountPaidWithTotalNeedPay();
  }

  private async loadCustomers(): Promise<void> {
    this.loadingCustomers = true;
    try {
      const pageData = await this.khachHangService.findAll(1, 1000);
      this.customerOptions = pageData.items;
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách khách hàng');
      this.notification.error('Thất bại', message);
      this.customerOptions = [];
    } finally {
      this.loadingCustomers = false;
    }
  }
  async onMedicineNodeExpand(event: NzFormatEmitEvent): Promise<void> {
    const node = event.node;
    if (!node || event.eventName !== 'expand' || !node.isExpanded) {
      return;
    }

    const medicineKey = String(node.key ?? '');
    if (!medicineKey.startsWith('medicine-')) {
      return;
    }
    if (this.loadedMedicineNodeKeys.has(medicineKey) || this.loadingMedicineNodeKeys.has(medicineKey)) {
      return;
    }

    const medicineId = Number(medicineKey.replace('medicine-', ''));
    if (!Number.isFinite(medicineId)) {
      return;
    }

    this.loadingMedicineNodeKeys.add(medicineKey);
    try {
      const imports = await this.nhapHangService.findSaleImportsByMedicineId(medicineId);
      imports.forEach((item) => this.importOptionsById.set(item.id, item));

      const children: NzTreeNodeOptions[] = imports.map((item) => ({
        title: `Lô ${item.batchCode} (Tồn kho: ${item.quantity} - Giá bán: ${item.sellPrice})`,
        key: `import-${item.id}`,
        isLeaf: true,
        selectable: true
      }));

      this.medicineImportTreeNodes = this.medicineImportTreeNodes.map((treeNode) => {
        if (String(treeNode.key) !== medicineKey) {
          return treeNode;
        }
        return {
          ...treeNode,
          children,
          isLeaf: children.length === 0
        };
      });

      this.loadedMedicineNodeKeys.add(medicineKey);
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách lô nhập của thuốc');
      this.notification.error('Thất bại', message);
    } finally {
      this.loadingMedicineNodeKeys.delete(medicineKey);
    }
  }

  private async loadMedicineTreeByMedicine(): Promise<void> {
    this.loadingMedicineTree = true;
    try {
      const pageData = await this.thuocService.findAll(1, 1000);
      const medicines = pageData.items;

      this.medicineImportTreeNodes = medicines.map((medicine: Thuoc) => {
        const hasStock = medicine.totalQuantity > 0;
        return {
          key: `medicine-${medicine.id}`,
          title: `${medicine.name} (${hasStock ? `Còn hàng: ${medicine.totalQuantity}` : 'Hết hàng'})`,
          selectable: false,
          isLeaf: !hasStock,
          disabled: false,
          children: []
        } as NzTreeNodeOptions;
      });

      this.importOptionsById.clear();
      this.loadedMedicineNodeKeys.clear();
      this.loadingMedicineNodeKeys.clear();
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách thuốc');
      this.notification.error('Thất bại', message);
      this.medicineImportTreeNodes = [];
      this.importOptionsById.clear();
      this.loadedMedicineNodeKeys.clear();
      this.loadingMedicineNodeKeys.clear();
    } finally {
      this.loadingMedicineTree = false;
    }
  }

  private syncAmountPaidWithTotalNeedPay(): void {
    this.paymentForm.patchValue(
      {
        amountPaid: this.totalNeedPay
      },
      { emitEvent: false }
    );
  }
}


