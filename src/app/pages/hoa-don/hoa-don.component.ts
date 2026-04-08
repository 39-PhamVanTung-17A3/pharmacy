import { CommonModule } from '@angular/common';
import { Component, ComponentRef, ElementRef, OnDestroy, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTreeSelectComponent, NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { MenuComponent } from '../../components/menu/menu.component';
import { environment } from '../../../environments/environment';
import {
  CameraScannerSession,
  createBarcodeDetector,
  getCameraAccessErrorMessage,
  startCameraBarcodeScanner
} from '../../utils/barcode-scanner.util';
import { getErrorMessage } from '../../utils/error.util';
import { printInvoiceViaPopup } from '../../utils/invoice-print.util';
import { KhachHang, KhachHangService } from '../khach-hang/khach-hang.service';
import { PopupKhachHangComponent } from '../khach-hang/popup-khach-hang/popup-khach-hang.component';
import { NhapHang, NhapHangService } from '../nhap-hang/nhap-hang.service';
import { PopupNhapHangComponent } from '../nhap-hang/popup-nhap-hang/popup-nhap-hang.component';
import { Thuoc, ThuocService } from '../thuoc/thuoc.service';
import { PopupThuocComponent } from '../thuoc/popup-thuoc/popup-thuoc.component';
import { HoaDon, HoaDonItemRequest, HoaDonService } from './hoa-don.service';

interface BillItem {
  importId: number;
  medicineId: number;
  name: string;
  imageUrl: string | null;
  stockLabel: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

type PaymentMode = 'CASH' | 'BANK_QR';

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
    NzModalModule,
    NzSelectModule,
    NzTableModule,
    NzTreeSelectModule
  ],
  templateUrl: './hoa-don.component.html',
  styleUrl: './hoa-don.component.scss'
})
export class HoaDonComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly nhapHangService = inject(NhapHangService);
  private readonly thuocService = inject(ThuocService);
  private readonly khachHangService = inject(KhachHangService);
  private readonly hoaDonService = inject(HoaDonService);
  private readonly notification = inject(NzNotificationService);
  private readonly modal = inject(NzModalService);

  readonly saleForm = this.fb.group({
    selectedImportKey: this.fb.control<string | null>(null)
  });

  readonly customerForm = this.fb.group({
    customerId: this.fb.control<number | null>(null),
    phone: this.fb.nonNullable.control('')
  });

  readonly paymentForm = this.fb.nonNullable.group({
    paymentMode: ['CASH' as PaymentMode],
    discount: [0],
    amountPaid: [0]
  });

  medicineImportTreeNodes: NzTreeNodeOptions[] = [];
  allMedicineTreeNodes: NzTreeNodeOptions[] = [];
  expandedMedicineKeys: string[] = [];
  medicineTreeOpen = false;
  medicineTreeSearchKeyword = '';
  importOptionsById = new Map<number, NhapHang>();
  medicineImageById = new Map<number, string | null>();
  medicineSearchTokensById = new Map<number, string>();
  loadedMedicineNodeKeys = new Set<string>();
  loadingMedicineNodeKeys = new Set<string>();
  loadingMedicineTree = false;

  customerOptions: KhachHang[] = [];
  loadingCustomers = false;
  customerPopupOpen = false;
  private pendingMedicineForImport: Thuoc | null = null;
  checkoutLoading = false;
  currentInvoiceCode = 'Tự động';
  qrCodeUrl: string | null = null;
  qrTransferNote = '';
  isCameraScannerOpen = false;
  cameraScannerError = '';
  cameraScannerStarting = false;
  scanBatchSelectOpen = false;
  scanBatchSelectMedicineName = '';
  scanBatchSelectImports: NhapHang[] = [];
  lastPrintedInvoice: HoaDon | null = null;

  billItems: BillItem[] = [];
  @ViewChild('medicineTreeSelect') medicineTreeSelect?: NzTreeSelectComponent;
  @ViewChild('barcodeVideo') barcodeVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('medicinePopupHost', { read: ViewContainerRef }) medicinePopupHost?: ViewContainerRef;
  @ViewChild('importPopupHost', { read: ViewContainerRef }) importPopupHost?: ViewContainerRef;
  private cameraStream: MediaStream | null = null;
  private cameraScannerSession: CameraScannerSession | null = null;
  private medicinePopupRef: ComponentRef<PopupThuocComponent> | null = null;
  private importPopupRef: ComponentRef<PopupNhapHangComponent> | null = null;

  async ngOnInit(): Promise<void> {
    this.customerForm.controls.customerId.valueChanges.subscribe((customerId) => {
      this.onCustomerChange(customerId);
    });

    this.paymentForm.controls.discount.valueChanges.subscribe(() => {
      this.syncAmountPaidWithTotalNeedPay();
    });

    this.paymentForm.controls.paymentMode.valueChanges.subscribe((mode) => {
      this.handlePaymentModeChange(mode);
    });

    this.saleForm.controls.selectedImportKey.valueChanges.subscribe((selectedKey) => {
      this.onImportOrderSelected(selectedKey);
    });

    await Promise.all([this.loadCustomers(), this.loadMedicineTreeByMedicine()]);
  }

  ngOnDestroy(): void {
    this.stopCameraScanner();
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

  displayMedicineNode = (node: { origin?: Record<string, unknown>; title?: string | null }): string => {
    const displayTitle = typeof node?.origin?.['displayTitle'] === 'string' ? node.origin['displayTitle'] as string : '';
    return displayTitle || String(node?.title ?? '');
  };

  onMedicineTreeOpenChange(isOpen: boolean): void {
    this.medicineTreeOpen = isOpen;
    if (!isOpen) {
      this.medicineTreeSearchKeyword = '';
      this.medicineTreeSelect?.setInputValue('');
      this.applyMedicineTreeFilter();
      return;
    }
    this.syncMedicineTreeKeywordFromInput();
    this.applyMedicineTreeFilter();
  }

  onMedicineTreeInput(event: Event): void {
    const target = event?.target as HTMLInputElement | null;
    this.medicineTreeSearchKeyword = target?.value ?? this.medicineTreeSearchKeyword;
    this.applyMedicineTreeFilter();
  }

  onMedicineTreeCleared(): void {
    this.medicineTreeSearchKeyword = '';
    this.applyMedicineTreeFilter();
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

  onQtyInput(index: number, value: number | string | null, inputEl?: HTMLInputElement): void {
    const currentItem = this.billItems[index];
    const parsedValue = Number(value);
    const nextValue = Math.floor(Number.isFinite(parsedValue) ? parsedValue : 1);
    const safeValue = Math.min(Math.max(nextValue, 1), currentItem.maxQuantity);

    if (nextValue > currentItem.maxQuantity) {
      this.notification.warning('Cảnh báo', 'Số lượng bán vượt quá tồn kho của lô nhập');
    }

    if (inputEl && Number(inputEl.value) !== safeValue) {
      inputEl.value = String(safeValue);
    }

    currentItem.quantity = safeValue;
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
    this.qrCodeUrl = null;
    this.qrTransferNote = '';
    this.currentInvoiceCode = 'Tự động';
    this.syncAmountPaidWithTotalNeedPay();
  }

  async submitCheckout(): Promise<void> {
    if (this.billItems.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng thêm ít nhất một sản phẩm để thanh toán');
      return;
    }

    if (this.normalizeBillItemQuantities()) {
      this.notification.warning(
        'Cảnh báo',
        'Có sản phẩm vượt tồn kho nên hệ thống đã tự điều chỉnh số lượng. Vui lòng kiểm tra lại trước khi thanh toán.'
      );
      return;
    }

    const customerId = this.customerForm.controls.customerId.value;
    if (!customerId && this.amountPaid < this.totalNeedPay) {
      this.notification.warning('Cảnh báo', 'Khách lẻ phải thanh toán đủ, không được ghi nợ');
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
        customerId ?? null,
        items,
        this.discount,
        this.amountPaid
      );

      this.currentInvoiceCode = savedInvoice.code;
      this.lastPrintedInvoice = savedInvoice;
      this.notification.success('Thành công', `Thanh toán hóa đơn ${savedInvoice.code} thành công`);

      this.showPrintConfirmDialog();
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

  openMedicinePopup(): void {
    if (this.medicinePopupRef) {
      this.medicinePopupRef.setInput('open', true);
      return;
    }

    if (!this.medicinePopupHost) {
      return;
    }

    this.medicinePopupHost.clear();
    this.medicinePopupRef = this.medicinePopupHost.createComponent(PopupThuocComponent);
    this.medicinePopupRef.setInput('open', true);
    this.medicinePopupRef.setInput('editingMedicine', null);

    this.medicinePopupRef.instance.closePopup.subscribe(() => {
      this.closeMedicinePopup();
    });

    this.medicinePopupRef.instance.medicineSaved.subscribe((savedMedicine) => {
      void this.onMedicineSaved(savedMedicine);
    });
  }

  closeMedicinePopup(): void {
    if (this.medicinePopupRef) {
      this.medicinePopupRef.destroy();
      this.medicinePopupRef = null;
    }
    this.medicinePopupHost?.clear();
  }

  async onMedicineSaved(savedMedicine: Thuoc): Promise<void> {
    this.pendingMedicineForImport = savedMedicine;
    this.closeMedicinePopup();
    await this.openImportPopup(savedMedicine.id);
  }

  private async openImportPopup(initialMedicineId: number): Promise<void> {
    if (this.importPopupRef) {
      this.importPopupRef.setInput('open', true);
      this.importPopupRef.setInput('editingImport', null);
      this.importPopupRef.setInput('initialMedicineId', initialMedicineId);
      return;
    }

    if (!this.importPopupHost) {
      return;
    }

    this.importPopupHost.clear();
    this.importPopupRef = this.importPopupHost.createComponent(PopupNhapHangComponent);
    this.importPopupRef.setInput('open', true);
    this.importPopupRef.setInput('editingImport', null);
    this.importPopupRef.setInput('initialMedicineId', initialMedicineId);

    this.importPopupRef.instance.closePopup.subscribe(() => {
      this.closeImportPopup();
    });

    this.importPopupRef.instance.importSaved.subscribe((savedImport) => {
      void this.onImportCreatedFromMedicineFlow(savedImport);
    });
  }

  closeImportPopup(): void {
    if (this.importPopupRef) {
      this.importPopupRef.destroy();
      this.importPopupRef = null;
    }
    this.importPopupHost?.clear();
  }

  async onImportCreatedFromMedicineFlow(savedImport: NhapHang): Promise<void> {
    this.closeImportPopup();

    this.importOptionsById.set(savedImport.id, savedImport);
    if (this.pendingMedicineForImport && this.pendingMedicineForImport.id === savedImport.medicineId) {
      this.medicineImageById.set(savedImport.medicineId, this.pendingMedicineForImport.imageUrl ?? null);
    }

    this.onImportOrderSelected(`import-${savedImport.id}`);
    this.pendingMedicineForImport = null;
    await this.loadMedicineTreeByMedicine();
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
      this.notification.success('Thành công', `Đã cộng thêm: ${selectedImport.medicineName} (Tổng: ${this.billItems[existedIndex].quantity})`);
      this.saleForm.controls.selectedImportKey.setValue(null, { emitEvent: false });
      this.medicineTreeOpen = false;
      return;
    }

    const defaultPrice = selectedImport.sellPrice > 0 ? selectedImport.sellPrice : selectedImport.importPrice;
    const newItem: BillItem = {
      importId: selectedImport.id,
      medicineId: selectedImport.medicineId,
      name: selectedImport.medicineName,
      imageUrl: this.medicineImageById.get(selectedImport.medicineId) ?? null,
      stockLabel: `Lô: ${selectedImport.batchCode} (Tồn kho: ${selectedImport.quantity})`,
      price: defaultPrice,
      quantity: 1,
      maxQuantity: selectedImport.quantity
    };

    this.billItems = [newItem, ...this.billItems];
    this.saleForm.controls.selectedImportKey.setValue(null, { emitEvent: false });
    this.syncAmountPaidWithTotalNeedPay();
    this.medicineTreeOpen = false;
    this.notification.success('Thành công', `Đã thêm: ${selectedImport.medicineName} (SL: 1)`);
  }

  async onBarcodeScanSubmit(rawBarcode?: string): Promise<void> {
    const barcode = (rawBarcode ?? '').trim();
    if (!barcode) {
      this.notification.warning('Cảnh báo', 'Không nhận được mã vạch để quét');
      return;
    }

    try {
      const medicine = await this.thuocService.findByBarcode(barcode);
      const imports = await this.nhapHangService.findSaleImportsByMedicineId(medicine.id);
      if (imports.length === 0) {
        this.notification.warning('Cảnh báo', `Thuốc ${medicine.name} hiện không còn lô bán khả dụng`);
        return;
      }

      imports.forEach((item) => this.importOptionsById.set(item.id, item));
      if (imports.length === 1) {
        this.onImportOrderSelected(`import-${imports[0].id}`);
        return;
      }
      this.openScanBatchSelectModal(medicine.name, imports);
    } catch (error) {
      const message = getErrorMessage(error, 'Không tìm thấy thuốc theo mã vạch');
      this.notification.error('Thất bại', message);
      console.error('Scan barcode ở hóa đơn failed', error);
    }
  }

  closeScanBatchSelectModal(): void {
    this.scanBatchSelectOpen = false;
    this.scanBatchSelectMedicineName = '';
    this.scanBatchSelectImports = [];
  }

  selectImportFromScan(importId: number): void {
    this.onImportOrderSelected(`import-${importId}`);
    this.closeScanBatchSelectModal();
  }

  getMedicineImageUrl(medicineId: number): string | null {
    return this.medicineImageById.get(medicineId) ?? null;
  }

  async openCameraScanner(): Promise<void> {
    if (!window.isSecureContext) {
      this.notification.warning(
        'Cảnh báo',
        'Trang hiện không bảo mật (HTTP). Hãy dùng HTTPS hoặc localhost để mở camera.'
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.notification.warning('Cảnh báo', 'Thiết bị không hỗ trợ truy cập camera');
      return;
    }

    this.isCameraScannerOpen = true;
    this.cameraScannerError = '';
    this.cameraScannerStarting = true;
    setTimeout(() => {
      void this.startCameraScanner();
    }, 0);
  }

  closeCameraScanner(): void {
    this.stopCameraScanner();
    this.isCameraScannerOpen = false;
    this.cameraScannerStarting = false;
  }

  generatePaymentQr(): void {
    if (this.billItems.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng thêm sản phẩm trước khi tạo mã QR');
      return;
    }

    if (this.totalNeedPay <= 0) {
      this.notification.warning('Cảnh báo', 'Số tiền cần thanh toán phải lớn hơn 0');
      return;
    }

    const qrConfig = environment.paymentQr;
    const invoiceRef = this.currentInvoiceCode === 'Tự động'
      ? `HD-TAM-${Date.now().toString().slice(-6)}`
      : this.currentInvoiceCode;
    const amount = Math.round(this.totalNeedPay);
    const addInfo = `TT ${invoiceRef}`;
    const accountName = qrConfig.accountName;

    this.qrTransferNote = addInfo;
    this.qrCodeUrl =
      `https://img.vietqr.io/image/${qrConfig.bankBin}-${qrConfig.accountNo}-${qrConfig.template}.png` +
      `?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
  }

  private normalizeBillItemQuantities(): boolean {
    let hasAdjusted = false;

    this.billItems.forEach((item) => {
      const normalizedQty = Math.min(Math.max(Math.floor(Number(item.quantity) || 1), 1), item.maxQuantity);
      if (normalizedQty !== item.quantity) {
        item.quantity = normalizedQty;
        hasAdjusted = true;
      }
    });

    if (hasAdjusted) {
      this.billItems = [...this.billItems];
      this.syncAmountPaidWithTotalNeedPay();
    }

    return hasAdjusted;
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
    this.syncMedicineTreeKeywordFromInput();

    const node = event.node;
    if (!node || event.eventName !== 'expand') {
      return;
    }

    const medicineKey = String(node.key ?? '');
    if (!medicineKey.startsWith('medicine-')) {
      return;
    }

    this.setMedicineExpandedState(medicineKey, node.isExpanded);
    if (!node.isExpanded) {
      return;
    }
    await this.ensureMedicineNodeChildrenLoaded(medicineKey);
  }

  async onMedicineNodeClick(event: NzFormatEmitEvent): Promise<void> {
    const node = event.node;
    if (!node || event.eventName !== 'click') {
      return;
    }

    const medicineKey = String(node.key ?? '');
    if (!medicineKey.startsWith('medicine-') || node.isLeaf) {
      return;
    }

    const singleImportKey = this.getSingleImportKeyForMedicineNode(medicineKey);
    if (node.isExpanded && singleImportKey) {
      this.onImportOrderSelected(singleImportKey);
      return;
    }

    const nextExpanded = !this.expandedMedicineKeys.includes(medicineKey);
    this.setMedicineExpandedState(medicineKey, nextExpanded);
    if (nextExpanded) {
      await this.ensureMedicineNodeChildrenLoaded(medicineKey);
    }
  }

  private getSingleImportKeyForMedicineNode(medicineKey: string): string | null {
    const medicineNode = this.allMedicineTreeNodes.find((item) => String(item.key) === medicineKey);
    if (!medicineNode || !medicineNode.children || medicineNode.children.length !== 1) {
      return null;
    }
    const childKey = String(medicineNode.children[0].key ?? '');
    return childKey.startsWith('import-') ? childKey : null;
  }

  private setMedicineExpandedState(medicineKey: string, expanded: boolean): void {
    if (!expanded) {
      this.expandedMedicineKeys = this.expandedMedicineKeys.filter((key) => key !== medicineKey);
      return;
    }
    if (!this.expandedMedicineKeys.includes(medicineKey)) {
      this.expandedMedicineKeys = [...this.expandedMedicineKeys, medicineKey];
    }
  }

  private syncMedicineTreeKeywordFromInput(): void {
    const treeSelect = this.medicineTreeSelect;
    if (!treeSelect) {
      return;
    }
    this.medicineTreeSearchKeyword = String(treeSelect.inputValue || this.medicineTreeSearchKeyword || '');
  }

  private normalizeTreeSearchText(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private applyMedicineTreeFilter(): void {
    const normalizedSearch = this.normalizeTreeSearchText(this.medicineTreeSearchKeyword);
    if (!normalizedSearch) {
      this.medicineImportTreeNodes = [...this.allMedicineTreeNodes];
      return;
    }

    this.medicineImportTreeNodes = this.allMedicineTreeNodes.filter((node) => {
      if (!String(node.key ?? '').startsWith('medicine-')) {
        return false;
      }
      const searchText = this.normalizeTreeSearchText(String(node['searchText'] ?? node.title ?? ''));
      return searchText.includes(normalizedSearch);
    });
  }

  private async ensureMedicineNodeChildrenLoaded(medicineKey: string): Promise<void> {
    this.syncMedicineTreeKeywordFromInput();

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
      const medicineSearchTokens = this.medicineSearchTokensById.get(medicineId) ?? '';

      const children: NzTreeNodeOptions[] = imports.map((item) => {
        const displayTitle = `- Lô ${item.batchCode} (Kho: ${item.quantity})`;
        const searchableTitle = medicineSearchTokens ? `${displayTitle} ${medicineSearchTokens}` : displayTitle;
        return {
          title: searchableTitle,
          displayTitle,
          key: `import-${item.id}`,
          isLeaf: true,
          selectable: true
        } as NzTreeNodeOptions;
      });

      this.allMedicineTreeNodes = this.allMedicineTreeNodes.map((treeNode) => {
        if (String(treeNode.key) !== medicineKey) {
          return treeNode;
        }
        return {
          ...treeNode,
          children,
          isLeaf: children.length === 0
        };
      });

      this.applyMedicineTreeFilter();

      this.loadedMedicineNodeKeys.add(medicineKey);

      if (imports.length === 1) {
        this.onImportOrderSelected(`import-${imports[0].id}`);
      }
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
      this.medicineImageById.clear();
      this.medicineSearchTokensById.clear();
      medicines.forEach((medicine) => {
        this.medicineImageById.set(medicine.id, medicine.imageUrl ?? null);
      });

      this.allMedicineTreeNodes = medicines.map((medicine: Thuoc) => {
        const hasStock = medicine.totalQuantity > 0;
        const displayTitle = `${medicine.name} (${hasStock ? `Còn hàng: ${medicine.totalQuantity}` : 'Hết hàng'})`;
        const barcode = medicine.barcode?.trim() ?? '';
        const normalizedBarcode = barcode.replace(/\s+/g, '');
        const compactBarcode = barcode.replace(/[^0-9A-Za-z]/g, '');
        const searchTokens = [barcode, normalizedBarcode, compactBarcode]
          .filter((value, index, array) => value && array.indexOf(value) === index)
          .join(' ');
        const searchableTitle = searchTokens ? `${displayTitle} ${searchTokens}` : displayTitle;
        this.medicineSearchTokensById.set(medicine.id, searchTokens);
        return {
          key: `medicine-${medicine.id}`,
          title: searchableTitle,
          displayTitle,
          searchText: searchableTitle,
          selectable: false,
          isLeaf: !hasStock,
          disabled: false,
          children: []
        } as NzTreeNodeOptions;
      });

      this.applyMedicineTreeFilter();

      this.importOptionsById.clear();
      this.loadedMedicineNodeKeys.clear();
      this.loadingMedicineNodeKeys.clear();
      this.expandedMedicineKeys = [];
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách thuốc');
      this.notification.error('Thất bại', message);
      this.medicineImportTreeNodes = [];
      this.allMedicineTreeNodes = [];
      this.importOptionsById.clear();
      this.medicineImageById.clear();
      this.medicineSearchTokensById.clear();
      this.loadedMedicineNodeKeys.clear();
      this.loadingMedicineNodeKeys.clear();
      this.expandedMedicineKeys = [];
    } finally {
      this.loadingMedicineTree = false;
    }
  }

  private syncAmountPaidWithTotalNeedPay(): void {
    const paymentMode = this.paymentForm.controls.paymentMode.value;
    if (paymentMode === 'BANK_QR') {
      this.paymentForm.patchValue(
        {
          amountPaid: this.totalNeedPay
        },
        { emitEvent: false }
      );
      if (this.billItems.length > 0) {
        this.generatePaymentQr();
      } else {
        this.qrCodeUrl = null;
        this.qrTransferNote = '';
      }
      return;
    }

    this.paymentForm.patchValue(
      {
        amountPaid: this.totalNeedPay
      },
      { emitEvent: false }
    );
  }

  private handlePaymentModeChange(mode: PaymentMode): void {
    if (mode === 'BANK_QR') {
      this.paymentForm.controls.amountPaid.disable({ emitEvent: false });
      this.syncAmountPaidWithTotalNeedPay();
      return;
    }

    this.paymentForm.controls.amountPaid.enable({ emitEvent: false });
    this.qrCodeUrl = null;
    this.qrTransferNote = '';
  }

  private showPrintConfirmDialog(): void {
    this.modal.create({
      nzTitle: 'In hóa đơn',
      nzContent: `Bạn có muốn in hóa đơn ${this.currentInvoiceCode} không?`,
      nzOkText: 'In hóa đơn',
      nzCancelText: 'Không in',
      nzOnOk: () => {
        this.printInvoice();
        this.resetAfterCheckout();
      },
      nzOnCancel: () => {
        this.resetAfterCheckout();
      }
    });
  }

  private printInvoice(): void {
    if (!this.lastPrintedInvoice) {
      return;
    }

    const printed = printInvoiceViaPopup(this.lastPrintedInvoice);
    if (!printed) {
      this.notification.warning('Cảnh báo', 'Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup để in hóa đơn.');
      return;
    }
  }

  private async resetAfterCheckout(): Promise<void> {
    this.clearBill();
    this.lastPrintedInvoice = null;
    this.paymentForm.patchValue({
      paymentMode: 'CASH',
      discount: 0,
      amountPaid: 0
    });
    this.saleForm.patchValue({
      selectedImportKey: null
    });

    await this.loadMedicineTreeByMedicine();
  }

  private openScanBatchSelectModal(medicineName: string, imports: NhapHang[]): void {
    const sortedImports = [...imports].sort((a, b) => {
      const expiryA = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      const expiryB = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      if (expiryA !== expiryB) {
        return expiryA - expiryB;
      }
      return new Date(a.importedAt).getTime() - new Date(b.importedAt).getTime();
    });
    this.scanBatchSelectMedicineName = medicineName;
    this.scanBatchSelectImports = sortedImports;
    this.scanBatchSelectOpen = true;
  }

  private async startCameraScanner(): Promise<void> {
    const video = this.barcodeVideo?.nativeElement;
    if (!video) {
      this.cameraScannerError = 'Không mở được camera. Vui lòng thử lại.';
      this.cameraScannerStarting = false;
      return;
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      video.srcObject = this.cameraStream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      const barcodeDetector = createBarcodeDetector();
      this.cameraScannerSession = await startCameraBarcodeScanner(video, barcodeDetector, async (rawValue) => {
        await this.onBarcodeScanSubmit(rawValue);
      });
      this.cameraScannerError = '';
    } catch (error) {
      this.cameraScannerError = getCameraAccessErrorMessage(error);
      console.error('Start camera scanner failed', error);
    } finally {
      this.cameraScannerStarting = false;
    }
  }

  private stopCameraScanner(): void {
    if (this.cameraScannerSession) {
      this.cameraScannerSession.stop();
      this.cameraScannerSession = null;
    }

    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    const video = this.barcodeVideo?.nativeElement;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

}



