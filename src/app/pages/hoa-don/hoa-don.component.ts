import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MenuComponent } from '../../components/menu/menu.component';
import { environment } from '../../../environments/environment';
import {
  getCameraAccessErrorMessage
} from '../../utils/barcode-scanner.util';
import { CameraScannerWorkflow } from '../../utils/camera-scanner-workflow.util';
import { getErrorMessage } from '../../utils/error.util';
import { printInvoiceViaPopup } from '../../utils/invoice-print.util';
import { KhachHang, KhachHangService } from '../khach-hang/khach-hang.service';
import { PopupKhachHangComponent } from '../khach-hang/popup-khach-hang/popup-khach-hang.component';
import { NhapHang, NhapHangService } from '../nhap-hang/nhap-hang.service';
import { PopupNhapHangComponent } from '../nhap-hang/popup-nhap-hang/popup-nhap-hang.component';
import { Thuoc, ThuocService } from '../thuoc/thuoc.service';
import { PopupThuocComponent } from '../thuoc/popup-thuoc/popup-thuoc.component';
import { LotPickerPopupComponent } from './components/lot-picker-popup/lot-picker-popup.component';
import {
  MedicineImportTreeSelectComponent,
  SelectedMedicineImportPayload
} from './components/medicine-import-tree-select/medicine-import-tree-select.component';
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

interface HoaDonDraftData {
  billItems: BillItem[];
  customerId: number | null;
  customerPhone: string;
  paymentMode: PaymentMode;
  discount: number;
  amountPaid: number;
  currentInvoiceCode?: string;
  qrCodeUrl?: string | null;
  qrTransferNote?: string;
}

interface HoaDonWorkspaceDraftData extends HoaDonDraftData {
  id: number;
  title: string;
}

interface HoaDonMultiDraftData {
  activeWorkspaceId: number;
  workspaces: HoaDonWorkspaceDraftData[];
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
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzTableModule,
    LotPickerPopupComponent,
    MedicineImportTreeSelectComponent
  ],
  templateUrl: './hoa-don.component.html',
  styleUrl: './hoa-don.component.scss'
})
export class HoaDonComponent implements OnInit, OnDestroy {
  private static readonly BARCODE_API_COOLDOWN_MS = 5000;
  private static readonly BARCODE_NOTIFICATION_COOLDOWN_MS = 1200;
  private static readonly DRAFT_STORAGE_KEY = 'hoa_don_draft_v1';
  private static readonly MAX_WORKSPACES = 4;

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

  medicineTreeReloadToken = 0;
  importOptionsById = new Map<number, NhapHang>();
  medicineImageById = new Map<number, string | null>();

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
  workspaces: HoaDonWorkspaceDraftData[] = [];
  activeWorkspaceId: number | null = null;

  billItems: BillItem[] = [];
  @ViewChild('barcodeVideo') barcodeVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('medicinePopupHost', { read: ViewContainerRef }) medicinePopupHost?: ViewContainerRef;
  @ViewChild('importPopupHost', { read: ViewContainerRef }) importPopupHost?: ViewContainerRef;
  private readonly cameraScannerWorkflow = new CameraScannerWorkflow();
  private readonly barcodeLastApiCallAt = new Map<string, number>();
  private readonly barcodeBlockedReasonByValue = new Map<string, string>();
  private readonly barcodeLastNotificationAt = new Map<string, number>();
  private readonly saleImportsByMedicineId = new Map<number, NhapHang[]>();
  private saleImportsCacheLoaded = false;
  private saleImportsCacheLoadingPromise: Promise<void> | null = null;
  private medicinePopupRef: ComponentRef<PopupThuocComponent> | null = null;
  private importPopupRef: ComponentRef<PopupNhapHangComponent> | null = null;
  private applyingWorkspace = false;
  private nextWorkspaceId = 1;

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

    await this.loadCustomers();
    this.restoreDraftFromStorage();
    if (this.workspaces.length === 0) {
      this.addWorkspace();
    }
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

  isBillItemInvalid(item: BillItem): boolean {
    return item.quantity < 1 || item.quantity > item.maxQuantity || item.price <= 0;
  }

  get hasInvalidBillItems(): boolean {
    return this.billItems.some((item) => this.isBillItemInvalid(item));
  }

  get canAddWorkspace(): boolean {
    return this.workspaces.length < HoaDonComponent.MAX_WORKSPACES;
  }

  addWorkspace(): void {
    if (!this.canAddWorkspace) {
      this.notification.warning('Cảnh báo', `Chỉ tạo tối đa ${HoaDonComponent.MAX_WORKSPACES} hóa đơn cùng lúc`);
      return;
    }

    this.persistCurrentWorkspaceState();
    const workspaceId = this.nextWorkspaceId++;
    const workspace: HoaDonWorkspaceDraftData = {
      id: workspaceId,
      title: `Hóa đơn ${this.workspaces.length + 1}`,
      ...this.createEmptyDraft()
    };
    this.workspaces = [...this.workspaces, workspace];
    this.activateWorkspace(workspaceId);
    this.saveDraftToStorage();
  }

  activateWorkspace(workspaceId: number): void {
    if (this.activeWorkspaceId === workspaceId) {
      return;
    }

    this.persistCurrentWorkspaceState();
    const target = this.workspaces.find((item) => item.id === workspaceId);
    if (!target) {
      return;
    }
    this.activeWorkspaceId = workspaceId;
    this.applyWorkspaceState(target);
  }

  closeWorkspace(workspaceId: number, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.workspaces.length <= 1) {
      this.clearBill();
      return;
    }

    this.persistCurrentWorkspaceState();
    const closingIndex = this.workspaces.findIndex((item) => item.id === workspaceId);
    if (closingIndex < 0) {
      return;
    }

    const nextWorkspaces = this.workspaces.filter((item) => item.id !== workspaceId);
    this.workspaces = nextWorkspaces.map((item, index) => ({
      ...item,
      title: `Hóa đơn ${index + 1}`
    }));

    if (this.activeWorkspaceId === workspaceId) {
      const nextIndex = Math.min(closingIndex, this.workspaces.length - 1);
      const nextActive = this.workspaces[nextIndex];
      this.activeWorkspaceId = nextActive?.id ?? null;
      if (nextActive) {
        this.applyWorkspaceState(nextActive);
      }
    }

    this.saveDraftToStorage();
  }

  increaseQty(index: number): void {
    if (this.billItems[index].quantity >= this.billItems[index].maxQuantity) {
      this.notification.warning('Cảnh báo', 'Số lượng bán vượt quá tồn kho của lô nhập');
      return;
    }
    this.billItems[index].quantity += 1;
    this.billItems = [...this.billItems];
    this.syncAmountPaidWithTotalNeedPay();
    this.saveDraftToStorage();
  }

  decreaseQty(index: number): void {
    if (this.billItems[index].quantity <= 1) {
      return;
    }
    this.billItems[index].quantity -= 1;
    this.billItems = [...this.billItems];
    this.syncAmountPaidWithTotalNeedPay();
    this.saveDraftToStorage();
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
    this.saveDraftToStorage();
  }

  updatePrice(index: number, value: number | null): void {
    const nextValue = Math.max(Number(value) || 0, 0);
    this.billItems[index].price = nextValue;
    this.billItems = [...this.billItems];
    this.syncAmountPaidWithTotalNeedPay();
    this.saveDraftToStorage();
  }

  removeItem(index: number): void {
    this.billItems = this.billItems.filter((_, itemIndex) => itemIndex !== index);
    this.syncAmountPaidWithTotalNeedPay();
    this.saveDraftToStorage();
  }

  clearBill(): void {
    this.billItems = [];
    this.qrCodeUrl = null;
    this.qrTransferNote = '';
    this.currentInvoiceCode = 'Tự động';
    this.paymentForm.patchValue({
      paymentMode: 'CASH',
      discount: 0,
      amountPaid: 0
    });
    this.customerForm.patchValue({
      customerId: null,
      phone: ''
    });
    this.handlePaymentModeChange('CASH');
    this.syncAmountPaidWithTotalNeedPay();
    this.persistCurrentWorkspaceState();
    this.saveDraftToStorage();
  }

  async submitCheckout(): Promise<void> {
    if (this.billItems.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng thêm ít nhất một sản phẩm để thanh toán');
      return;
    }
    if (this.hasInvalidBillItems) {
      this.notification.warning('Cảnh báo', 'Vui lòng sửa các dòng sản phẩm đang lỗi trước khi thanh toán');
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
      this.saveDraftToStorage();
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
    this.saveDraftToStorage();
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
    this.saveDraftToStorage();
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
    this.clearBarcodeScanCache(savedMedicine.barcode);
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
    this.triggerMedicineTreeReload();
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
    this.saveDraftToStorage();
    this.notification.success('Thành công', `Đã thêm: ${selectedImport.medicineName} (SL: 1)`);
  }

  async onBarcodeScanSubmit(rawBarcode?: string): Promise<void> {
    const barcode = (rawBarcode ?? '').trim();
    if (!barcode) {
      this.notification.warning('Cảnh báo', 'Không nhận được mã vạch để quét');
      return;
    }

    const normalizedBarcode = this.normalizeBarcode(barcode);
    const blockedReason = this.barcodeBlockedReasonByValue.get(normalizedBarcode);
    if (blockedReason) {
      this.notifyBarcodeWarning(normalizedBarcode, blockedReason);
      return;
    }

    const now = Date.now();
    const lastApiCallAt = this.barcodeLastApiCallAt.get(normalizedBarcode) ?? 0;
    if (now - lastApiCallAt < HoaDonComponent.BARCODE_API_COOLDOWN_MS) {
      return;
    }
    this.barcodeLastApiCallAt.set(normalizedBarcode, now);

    try {
      const medicine = await this.thuocService.findByBarcode(barcode);
      this.medicineImageById.set(medicine.id, medicine.imageUrl ?? null);
      if ((medicine.totalQuantity ?? 0) <= 0) {
        const message = `Thuốc ${medicine.name} đã hết hàng`;
        this.barcodeBlockedReasonByValue.set(normalizedBarcode, message);
        this.notifyBarcodeWarning(normalizedBarcode, message);
        return;
      }

      await this.ensureSaleImportsCache();
      const imports = this.saleImportsByMedicineId.get(medicine.id) ?? [];
      if (imports.length === 0) {
        const message = `Thuốc ${medicine.name} hiện không còn lô bán khả dụng`;
        this.barcodeBlockedReasonByValue.set(normalizedBarcode, message);
        this.notifyBarcodeWarning(normalizedBarcode, message);
        return;
      }

      imports.forEach((item) => this.importOptionsById.set(item.id, item));
      if (imports.length === 1) {
        this.onImportOrderSelected(`import-${imports[0].id}`);
        return;
      }
      this.openScanBatchSelectModal(medicine.name, imports);
    } catch (error) {
      const message = this.resolveBarcodeErrorMessage(error);
      if (this.shouldBlockBarcodeAfterError(error)) {
        this.barcodeBlockedReasonByValue.set(normalizedBarcode, message);
        this.notifyBarcodeWarning(normalizedBarcode, message);
        return;
      }
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

  async openCameraScanner(): Promise<void> {
    const unavailableReason = CameraScannerWorkflow.getUnavailableReason();
    if (unavailableReason) {
      this.notification.warning('Cảnh báo', unavailableReason);
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
  onMedicineImportSelected(payload: SelectedMedicineImportPayload): void {
    this.importOptionsById.set(payload.importItem.id, payload.importItem);
    this.medicineImageById.set(payload.importItem.medicineId, payload.imageUrl ?? null);
    this.onImportOrderSelected(`import-${payload.importItem.id}`);
  }

  private triggerMedicineTreeReload(): void {
    this.saleImportsCacheLoaded = false;
    this.saleImportsByMedicineId.clear();
    this.medicineTreeReloadToken += 1;
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
      this.saveDraftToStorage();
      return;
    }

    this.paymentForm.patchValue(
      {
        amountPaid: this.totalNeedPay
      },
      { emitEvent: false }
    );
    this.saveDraftToStorage();
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
    this.saveDraftToStorage();
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
    this.saleForm.patchValue({
      selectedImportKey: null
    });

    this.triggerMedicineTreeReload();
  }

  private saveDraftToStorage(): void {
    if (this.applyingWorkspace) {
      return;
    }
    this.persistCurrentWorkspaceState();
    try {
      const draft: HoaDonMultiDraftData = {
        activeWorkspaceId: this.activeWorkspaceId ?? (this.workspaces[0]?.id ?? 0),
        workspaces: this.workspaces
      };
      localStorage.setItem(HoaDonComponent.DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore browser storage failures.
    }
  }

  private restoreDraftFromStorage(): void {
    try {
      const rawDraft = localStorage.getItem(HoaDonComponent.DRAFT_STORAGE_KEY);
      if (!rawDraft) {
        return;
      }

      const parsed = JSON.parse(rawDraft) as Partial<HoaDonMultiDraftData & HoaDonDraftData>;
      if (Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0) {
        this.workspaces = parsed.workspaces
          .slice(0, HoaDonComponent.MAX_WORKSPACES)
          .map((workspace, index) => ({
            id: Number(workspace.id) || index + 1,
            title: workspace.title || `Hóa đơn ${index + 1}`,
            ...this.normalizeDraft(workspace)
          }));

        this.nextWorkspaceId = this.workspaces.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
        const preferredId = Number(parsed.activeWorkspaceId) || this.workspaces[0].id;
        const firstWorkspace = this.workspaces.find((item) => item.id === preferredId) ?? this.workspaces[0];
        this.activeWorkspaceId = firstWorkspace.id;
        this.applyWorkspaceState(firstWorkspace);
        return;
      }

      if (Array.isArray(parsed.billItems)) {
        const singleWorkspace: HoaDonWorkspaceDraftData = {
          id: 1,
          title: 'Hóa đơn 1',
          ...this.normalizeDraft(parsed)
        };
        this.workspaces = [singleWorkspace];
        this.nextWorkspaceId = 2;
        this.activeWorkspaceId = 1;
        this.applyWorkspaceState(singleWorkspace);
      }
    } catch {
      this.clearDraftStorage();
    }
  }

  private clearDraftStorage(): void {
    try {
      localStorage.removeItem(HoaDonComponent.DRAFT_STORAGE_KEY);
    } catch {
      // Ignore browser storage failures.
    }
  }

  private createEmptyDraft(): HoaDonDraftData {
    return {
      billItems: [],
      customerId: null,
      customerPhone: '',
      paymentMode: 'CASH',
      discount: 0,
      amountPaid: 0,
      currentInvoiceCode: 'Tự động',
      qrCodeUrl: null,
      qrTransferNote: ''
    };
  }

  private normalizeDraft(raw: Partial<HoaDonDraftData>): HoaDonDraftData {
    const fallback = this.createEmptyDraft();
    return {
      billItems: Array.isArray(raw.billItems) ? raw.billItems : fallback.billItems,
      customerId: raw.customerId ?? fallback.customerId,
      customerPhone: raw.customerPhone ?? fallback.customerPhone,
      paymentMode: raw.paymentMode === 'BANK_QR' ? 'BANK_QR' : 'CASH',
      discount: Number(raw.discount) || 0,
      amountPaid: Number(raw.amountPaid) || 0,
      currentInvoiceCode: raw.currentInvoiceCode || fallback.currentInvoiceCode,
      qrCodeUrl: raw.qrCodeUrl ?? fallback.qrCodeUrl,
      qrTransferNote: raw.qrTransferNote ?? fallback.qrTransferNote
    };
  }

  private persistCurrentWorkspaceState(): void {
    if (this.applyingWorkspace || this.activeWorkspaceId === null) {
      return;
    }
    const index = this.workspaces.findIndex((item) => item.id === this.activeWorkspaceId);
    if (index < 0) {
      return;
    }

    const current = this.workspaces[index];
    const updated: HoaDonWorkspaceDraftData = {
      ...current,
      billItems: this.billItems,
      customerId: this.customerForm.controls.customerId.value ?? null,
      customerPhone: this.customerForm.controls.phone.value ?? '',
      paymentMode: this.paymentForm.controls.paymentMode.value,
      discount: Number(this.paymentForm.controls.discount.value) || 0,
      amountPaid: Number(this.paymentForm.controls.amountPaid.value) || 0,
      currentInvoiceCode: this.currentInvoiceCode,
      qrCodeUrl: this.qrCodeUrl,
      qrTransferNote: this.qrTransferNote
    };
    const next = [...this.workspaces];
    next[index] = updated;
    this.workspaces = next;
  }

  private applyWorkspaceState(workspace: HoaDonWorkspaceDraftData): void {
    this.applyingWorkspace = true;
    this.billItems = [...workspace.billItems];
    this.currentInvoiceCode = workspace.currentInvoiceCode || 'Tự động';
    this.qrCodeUrl = workspace.qrCodeUrl ?? null;
    this.qrTransferNote = workspace.qrTransferNote ?? '';
    this.lastPrintedInvoice = null;

    this.customerForm.patchValue(
      {
        customerId: workspace.customerId ?? null,
        phone: workspace.customerPhone ?? ''
      },
      { emitEvent: false }
    );

    this.paymentForm.patchValue(
      {
        paymentMode: workspace.paymentMode === 'BANK_QR' ? 'BANK_QR' : 'CASH',
        discount: Number(workspace.discount) || 0,
        amountPaid: Number(workspace.amountPaid) || 0
      },
      { emitEvent: false }
    );
    this.applyingWorkspace = false;
    this.handlePaymentModeChange(this.paymentForm.controls.paymentMode.value);
    this.syncAmountPaidWithTotalNeedPay();
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
      await this.cameraScannerWorkflow.start(video, async (rawValue) => {
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
    this.cameraScannerWorkflow.stop(this.barcodeVideo?.nativeElement);
  }

  private normalizeBarcode(barcode: string): string {
    return barcode.trim().toUpperCase();
  }

  private clearBarcodeScanCache(barcode: string | null | undefined): void {
    if (!barcode) {
      return;
    }
    const normalizedBarcode = this.normalizeBarcode(barcode);
    if (!normalizedBarcode) {
      return;
    }

    this.barcodeBlockedReasonByValue.delete(normalizedBarcode);
    this.barcodeLastApiCallAt.delete(normalizedBarcode);
    this.barcodeLastNotificationAt.delete(normalizedBarcode);
  }

  private notifyBarcodeWarning(normalizedBarcode: string, message: string): void {
    const now = Date.now();
    const lastNotifiedAt = this.barcodeLastNotificationAt.get(normalizedBarcode) ?? 0;
    if (now - lastNotifiedAt < HoaDonComponent.BARCODE_NOTIFICATION_COOLDOWN_MS) {
      return;
    }
    this.barcodeLastNotificationAt.set(normalizedBarcode, now);
    this.notification.warning('Cảnh báo', message);
  }

  private shouldBlockBarcodeAfterError(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 404;
    }
    const message = getErrorMessage(error, '').toLowerCase();
    return message.includes('không tìm thấy');
  }

  private resolveBarcodeErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return 'Không tìm thấy thuốc theo mã vạch';
    }
    return getErrorMessage(error, 'Không tìm thấy thuốc theo mã vạch');
  }

  private async ensureSaleImportsCache(): Promise<void> {
    if (this.saleImportsCacheLoaded) {
      return;
    }

    if (this.saleImportsCacheLoadingPromise) {
      await this.saleImportsCacheLoadingPromise;
      return;
    }

    this.saleImportsCacheLoadingPromise = (async () => {
      const saleTree = await this.nhapHangService.findSaleTree();
      this.saleImportsByMedicineId.clear();
      for (const item of saleTree.imports) {
        if (item.quantity <= 0) {
          continue;
        }
        const current = this.saleImportsByMedicineId.get(item.medicineId) ?? [];
        current.push(item);
        this.saleImportsByMedicineId.set(item.medicineId, current);
      }

      for (const [medicineId, imports] of this.saleImportsByMedicineId.entries()) {
        const sorted = [...imports].sort((a, b) => {
          const expiryA = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          const expiryB = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
          if (expiryA !== expiryB) {
            return expiryA - expiryB;
          }
          return new Date(a.importedAt).getTime() - new Date(b.importedAt).getTime();
        });
        this.saleImportsByMedicineId.set(medicineId, sorted);
      }

      this.saleImportsCacheLoaded = true;
    })();

    try {
      await this.saleImportsCacheLoadingPromise;
    } finally {
      this.saleImportsCacheLoadingPromise = null;
    }
  }

}






