import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTreeNodeOptions } from 'ng-zorro-antd/core/tree';
import { NzFormatEmitEvent } from 'ng-zorro-antd/tree';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { MenuComponent } from '../../components/menu/menu.component';
import { environment } from '../../../environments/environment';
import { getErrorMessage } from '../../utils/error.util';
import { KhachHang, KhachHangService } from '../khach-hang/khach-hang.service';
import { PopupKhachHangComponent } from '../khach-hang/popup-khach-hang/popup-khach-hang.component';
import { NhapHang, NhapHangService } from '../nhap-hang/nhap-hang.service';
import { Thuoc, ThuocService } from '../thuoc/thuoc.service';
import { HoaDonItemRequest, HoaDonService } from './hoa-don.service';

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

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

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

  readonly saleForm = this.fb.group({
    selectedImportKey: this.fb.control<string | null>(null),
    barcodeScan: this.fb.nonNullable.control('')
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
  expandedMedicineKeys: string[] = [];
  medicineTreeOpen = false;
  importOptionsById = new Map<number, NhapHang>();
  medicineImageById = new Map<number, string | null>();
  loadedMedicineNodeKeys = new Set<string>();
  loadingMedicineNodeKeys = new Set<string>();
  loadingMedicineTree = false;

  customerOptions: KhachHang[] = [];
  loadingCustomers = false;
  customerPopupOpen = false;
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

  billItems: BillItem[] = [];
  @ViewChild('barcodeVideo') barcodeVideo?: ElementRef<HTMLVideoElement>;
  private cameraStream: MediaStream | null = null;
  private cameraScanTimer: number | null = null;
  private barcodeDetector: BarcodeDetectorLike | null = null;
  private cameraScanBusy = false;

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
      this.notification.success('Thành công', `Thanh toán hóa đơn ${savedInvoice.code} thành công`);
      this.qrCodeUrl = null;
      this.qrTransferNote = '';

      this.clearBill();
      this.paymentForm.patchValue({
        paymentMode: 'CASH',
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
  }

  async onBarcodeScanSubmit(): Promise<void> {
    const barcode = this.saleForm.controls.barcodeScan.value.trim();
    if (!barcode) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập mã vạch thuốc để quét');
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
      this.saleForm.patchValue({ barcodeScan: '' }, { emitEvent: false });
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
    const invoiceRef = this.currentInvoiceCode !== 'Tự động'
      ? this.currentInvoiceCode
      : `HD-TAM-${Date.now().toString().slice(-6)}`;
    const amount = Math.round(this.totalNeedPay);
    const addInfo = `TT ${invoiceRef}`;
    const accountName = qrConfig.accountName;

    this.qrTransferNote = addInfo;
    this.qrCodeUrl =
      `https://img.vietqr.io/image/${qrConfig.bankBin}-${qrConfig.accountNo}-${qrConfig.template}.png` +
      `?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
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
    const medicineNode = this.medicineImportTreeNodes.find((item) => String(item.key) === medicineKey);
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

  private async ensureMedicineNodeChildrenLoaded(medicineKey: string): Promise<void> {
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
      medicines.forEach((medicine) => {
        this.medicineImageById.set(medicine.id, medicine.imageUrl ?? null);
      });

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
      this.expandedMedicineKeys = [];
    } catch (error) {
      const message = getErrorMessage(error, 'Không tải được danh sách thuốc');
      this.notification.error('Thất bại', message);
      this.medicineImportTreeNodes = [];
      this.importOptionsById.clear();
      this.medicineImageById.clear();
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
      this.initBarcodeDetector();
      this.startCameraDetectLoop(video);
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : '';
      if (errorName === 'NotAllowedError') {
        this.cameraScannerError = 'Bạn đã chặn quyền camera. Hãy cấp quyền camera trong trình duyệt.';
      } else if (errorName === 'NotFoundError') {
        this.cameraScannerError = 'Không tìm thấy camera trên thiết bị.';
      } else if (errorName === 'NotReadableError') {
        this.cameraScannerError = 'Camera đang được ứng dụng khác sử dụng.';
      } else {
        this.cameraScannerError = 'Không thể truy cập camera. Vui lòng cấp quyền camera.';
      }
      console.error('Start camera scanner failed', error);
    } finally {
      this.cameraScannerStarting = false;
    }
  }

  private initBarcodeDetector(): void {
    if (this.barcodeDetector) {
      return;
    }
    const detectorGlobal = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor };
    if (!detectorGlobal.BarcodeDetector) {
      this.cameraScannerError = 'Trình duyệt chưa hỗ trợ BarcodeDetector. Hãy dùng ô nhập mã hoặc máy quét.';
      return;
    }

    this.barcodeDetector = new detectorGlobal.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
    });
  }

  private startCameraDetectLoop(video: HTMLVideoElement): void {
    if (!this.barcodeDetector) {
      return;
    }
    this.cameraScanTimer = window.setInterval(() => {
      void this.detectFromVideoFrame(video);
    }, 350);
  }

  private async detectFromVideoFrame(video: HTMLVideoElement): Promise<void> {
    if (!this.barcodeDetector || this.cameraScanBusy || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      return;
    }

    this.cameraScanBusy = true;
    try {
      const results = await this.barcodeDetector.detect(video);
      const rawValue = results.find((item) => !!item.rawValue)?.rawValue?.trim();
      if (!rawValue) {
        return;
      }

      this.saleForm.patchValue({ barcodeScan: rawValue }, { emitEvent: false });
      await this.onBarcodeScanSubmit();
      this.closeCameraScanner();
    } catch (error) {
      console.error('Detect barcode from camera failed', error);
    } finally {
      this.cameraScanBusy = false;
    }
  }

  private stopCameraScanner(): void {
    if (this.cameraScanTimer !== null) {
      window.clearInterval(this.cameraScanTimer);
      this.cameraScanTimer = null;
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



