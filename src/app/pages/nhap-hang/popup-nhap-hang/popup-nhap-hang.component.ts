import { CommonModule } from '@angular/common';
import { getErrorMessage } from '../../../utils/error.util';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { Thuoc, ThuocService } from '../../thuoc/thuoc.service';
import { NhapHang, NhapHangService } from '../nhap-hang.service';
import {
  CameraScannerSession,
  createBarcodeDetector,
  getCameraAccessErrorMessage,
  startCameraBarcodeScanner
} from '../../../utils/barcode-scanner.util';
import { generateBatchCodeByCurrentDate, toDateInputValue } from '../../../utils/nhap-hang.util';

@Component({
  selector: 'app-popup-nhap-hang',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzModalModule,
    NzNotificationModule
  ],
  templateUrl: './popup-nhap-hang.component.html',
  styleUrl: './popup-nhap-hang.component.scss'
})
export class PopupNhapHangComponent implements OnInit, OnChanges, OnDestroy {
  @Input() open = false;
  @Input() editingImport: NhapHang | null = null;

  @Output() closePopup = new EventEmitter<void>();
  @Output() importSaved = new EventEmitter<NhapHang>();

  private readonly fb = inject(FormBuilder);
  private readonly nhapHangService = inject(NhapHangService);
  private readonly thuocService = inject(ThuocService);
  private readonly notification = inject(NzNotificationService);

  isSubmitting = false;
  medicineOptions: Thuoc[] = [];
  isCameraScannerOpen = false;
  cameraScannerError = '';
  cameraScannerStarting = false;

  @ViewChild('barcodeVideo') barcodeVideo?: ElementRef<HTMLVideoElement>;
  private cameraStream: MediaStream | null = null;
  private cameraScannerSession: CameraScannerSession | null = null;

  readonly form = this.fb.nonNullable.group({
    barcodeScan: [''],
    medicineId: [0, [Validators.required, Validators.min(1)]],
    batchCode: ['', Validators.required],
    supplier: ['', [Validators.maxLength(160)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    importPrice: [0, [Validators.required, Validators.min(0)]],
    sellPrice: [0, [Validators.min(0)]],
    expiryDate: [''],
    importedAt: ['', Validators.required]
  });

  get isEditMode(): boolean {
    return this.editingImport !== null;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMedicineOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.syncFormWithMode();
    }

    if (changes['open'] && !this.open) {
      this.closeCameraScanner();
    }
  }

  ngOnDestroy(): void {
    this.stopCameraScanner();
  }

  close(): void {
    if (this.isSubmitting) {
      return;
    }
    this.closeCameraScanner();
    this.closePopup.emit();
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      Object.values(this.form.controls).forEach((control) => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.isSubmitting = true;
    try {
      const value = this.form.getRawValue();
      const medicineId = Number(value.medicineId) || 0;
      const batchCode = value.batchCode.trim();
      const supplier = value.supplier.trim();
      const quantity = Number(value.quantity) || 0;
      const importPrice = Number(value.importPrice) || 0;
      const sellPrice = Number(value.sellPrice) || 0;
      const expiryDate = value.expiryDate;
      const importedAt = value.importedAt;

      const saved = this.isEditMode
        ? await this.nhapHangService.update(
            this.editingImport!.id,
            medicineId,
            batchCode,
            supplier,
            quantity,
            importPrice,
            sellPrice,
            expiryDate,
            importedAt
          )
        : await this.nhapHangService.create(
            medicineId,
            batchCode,
            supplier,
            quantity,
            importPrice,
            sellPrice,
            expiryDate,
            importedAt
          );

      this.importSaved.emit(saved);
      this.notification.success(
        'Thành công',
        this.isEditMode ? 'Cập nhật phiếu nhập thành công' : 'Tạo phiếu nhập thành công'
      );
      this.form.reset();
      this.closePopup.emit();
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Save nhập hàng failed', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async onBarcodeScanSubmit(): Promise<void> {
    const barcode = this.form.controls.barcodeScan.value.trim();
    if (!barcode) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập mã vạch thuốc để quét');
      return;
    }

    try {
      const medicine = await this.thuocService.findByBarcode(barcode);
      this.form.patchValue({ medicineId: medicine.id, barcodeScan: '' });
      this.notification.success('Thành công', `Đã chọn thuốc: ${medicine.name}`);
    } catch (error) {
      const message = getErrorMessage(error, 'Không tìm thấy thuốc theo mã vạch');
      this.notification.error('Thất bại', message);
      console.error('Scan barcode ở nhập hàng failed', error);
    }
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

  private syncFormWithMode(): void {
    if (this.editingImport) {
      this.form.setValue({
        barcodeScan: '',
        medicineId: this.editingImport.medicineId,
        batchCode: this.editingImport.batchCode,
        supplier: this.editingImport.supplier,
        quantity: this.editingImport.quantity,
        importPrice: this.editingImport.importPrice,
        sellPrice: this.editingImport.sellPrice,
        expiryDate: this.editingImport.expiryDate,
        importedAt: this.editingImport.importedAt
      });
      return;
    }

    this.form.reset({
      barcodeScan: '',
      medicineId: 0,
      batchCode: this.generateDefaultBatchCode(),
      supplier: '',
      quantity: 0,
      importPrice: 0,
      sellPrice: 0,
      expiryDate: '',
      importedAt: this.getTodayDateInputValue()
    });
  }

  private async loadMedicineOptions(): Promise<void> {
    try {
      const response = await this.thuocService.findAll(1, 1000);
      this.medicineOptions = response.items;
    } catch (error) {
      this.medicineOptions = [];
      const message = getErrorMessage(error, 'Không tải được danh sách thuốc');
      this.notification.error('Thất bại', message);
      console.error('Load danh sách thuốc failed', error);
    }
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
        this.form.patchValue({ barcodeScan: rawValue }, { emitEvent: false });
        await this.onBarcodeScanSubmit();
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

  private getTodayDateInputValue(): string {
    return toDateInputValue();
  }

  private generateDefaultBatchCode(): string {
    return generateBatchCodeByCurrentDate();
  }
}
