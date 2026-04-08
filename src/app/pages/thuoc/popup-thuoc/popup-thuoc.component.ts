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
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { DanhMucThuoc, DanhMucThuocService } from '../../danh-muc-thuoc/danh-muc-thuoc.service';
import { Thuoc, ThuocService } from '../thuoc.service';
import {
  CameraScannerSession,
  createBarcodeDetector,
  getCameraAccessErrorMessage,
  startCameraBarcodeScanner
} from '../../../utils/barcode-scanner.util';

@Component({
  selector: 'app-popup-thuoc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule,
    NzNotificationModule
  ],
  templateUrl: './popup-thuoc.component.html',
  styleUrl: './popup-thuoc.component.scss'
})
export class PopupThuocComponent implements OnInit, OnChanges, OnDestroy {
  @Input() open = false;
  @Input() editingMedicine: Thuoc | null = null;

  @Output() closePopup = new EventEmitter<void>();
  @Output() medicineSaved = new EventEmitter<Thuoc>();

  private readonly fb = inject(FormBuilder);
  private readonly danhMucThuocService = inject(DanhMucThuocService);
  private readonly thuocService = inject(ThuocService);
  private readonly notification = inject(NzNotificationService);

  categoryOptions: DanhMucThuoc[] = [];
  isSubmitting = false;
  isCameraScannerOpen = false;
  cameraScannerError = '';
  cameraScannerStarting = false;
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isImageCameraOpen = false;
  imageCameraError = '';
  imageCameraStarting = false;
  private localImagePreviewObjectUrl: string | null = null;

  @ViewChild('barcodeVideo') barcodeVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('imageCameraVideo') imageCameraVideo?: ElementRef<HTMLVideoElement>;
  private cameraStream: MediaStream | null = null;
  private imageCameraStream: MediaStream | null = null;
  private cameraScannerSession: CameraScannerSession | null = null;

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    category: this.fb.control<DanhMucThuoc | null>(null, Validators.required),
    barcode: this.fb.nonNullable.control('', [Validators.maxLength(100)]),
    unit: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)])
  });

  get isEditMode(): boolean {
    return this.editingMedicine !== null;
  }

  async ngOnInit(): Promise<void> {
    await this.loadCategoryOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.syncFormWithMode();
    }
    if (changes['open'] && !this.open) {
      this.closeCameraScanner();
      this.closeImageCamera();
      this.clearImageSelection();
    }
  }

  ngOnDestroy(): void {
    this.stopCameraScanner();
    this.stopImageCamera();
    this.clearImageSelection();
  }

  close(): void {
    if (this.isSubmitting) {
      return;
    }
    this.closeCameraScanner();
    this.closeImageCamera();
    this.clearImageSelection();
    this.closePopup.emit();
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

  onImageFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn file ảnh hợp lệ');
      if (target) {
        target.value = '';
      }
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.notification.warning('Cảnh báo', 'Kích thước ảnh tối đa 5MB');
      if (target) {
        target.value = '';
      }
      return;
    }

    this.selectedImageFile = file;
    this.revokeLocalImagePreviewObjectUrl();
    this.localImagePreviewObjectUrl = URL.createObjectURL(file);
    this.imagePreviewUrl = this.localImagePreviewObjectUrl;
  }

  async openImageCamera(): Promise<void> {
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

    this.isImageCameraOpen = true;
    this.imageCameraError = '';
    this.imageCameraStarting = true;
    setTimeout(() => {
      void this.startImageCamera();
    }, 0);
  }

  closeImageCamera(): void {
    this.stopImageCamera();
    this.isImageCameraOpen = false;
    this.imageCameraStarting = false;
  }

  async captureImageFromCamera(): Promise<void> {
    const video = this.imageCameraVideo?.nativeElement;
    if (!video) {
      this.imageCameraError = 'Không tìm thấy khung camera để chụp ảnh.';
      return;
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      this.imageCameraError = 'Camera chưa sẵn sàng. Vui lòng thử lại.';
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      this.imageCameraError = 'Không thể xử lý ảnh vừa chụp.';
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92);
    });

    if (!blob) {
      this.imageCameraError = 'Không thể tạo file ảnh từ camera.';
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (blob.size > maxSizeInBytes) {
      this.imageCameraError = 'Ảnh chụp vượt quá 5MB. Vui lòng thử lại.';
      return;
    }

    const fileName = `medicine-camera-${Date.now()}.jpg`;
    const capturedFile = new File([blob], fileName, { type: 'image/jpeg' });
    this.selectedImageFile = capturedFile;
    this.revokeLocalImagePreviewObjectUrl();
    this.localImagePreviewObjectUrl = URL.createObjectURL(capturedFile);
    this.imagePreviewUrl = this.localImagePreviewObjectUrl;
    this.closeImageCamera();
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
      const name = value.name.trim();
      const category = value.category;
      const barcode = value.barcode.trim() || null;
      const unit = value.unit.trim();

      if (!category) {
        this.form.controls.category.markAsTouched();
        this.form.controls.category.markAsDirty();
        this.form.controls.category.updateValueAndValidity();
        return;
      }

      const saved = this.isEditMode
        ? await this.thuocService.update(this.editingMedicine!.id, name, category.id, barcode, unit, this.selectedImageFile)
        : await this.thuocService.create(name, category.id, barcode, unit, this.selectedImageFile);

      this.medicineSaved.emit(saved);
      this.notification.success('Thành công', this.isEditMode ? 'Cập nhật thuốc thành công' : 'Thêm thuốc thành công');
      this.form.reset();
      this.clearImageSelection();
      this.closePopup.emit();
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Save thuoc failed', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  clearImageSelection(): void {
    this.selectedImageFile = null;
    this.revokeLocalImagePreviewObjectUrl();
    this.imagePreviewUrl = this.editingMedicine?.imageUrl ?? null;
  }

  private async loadCategoryOptions(): Promise<void> {
    try {
      const response = await this.danhMucThuocService.findAll(1, 1000);
      this.categoryOptions = response.items;
    } catch (error) {
      this.categoryOptions = [];
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Load danh muc trong popup thuoc failed', error);
    }
  }

  private syncFormWithMode(): void {
    this.clearImageSelection();
    if (this.editingMedicine) {
      const selectedCategory =
        this.categoryOptions.find((item) => item.id === this.editingMedicine!.category.id) ??
        ({
          id: this.editingMedicine.category.id,
          name: this.editingMedicine.category.name,
          description: this.editingMedicine.category.description
        } as DanhMucThuoc);

      this.form.setValue({
        name: this.editingMedicine.name,
        category: selectedCategory,
        barcode: this.editingMedicine.barcode ?? '',
        unit: this.editingMedicine.unit
      });
      this.imagePreviewUrl = this.editingMedicine.imageUrl;
      return;
    }

    this.form.reset({
      name: '',
      category: null,
      barcode: '',
      unit: ''
    });
    this.imagePreviewUrl = null;
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
        this.form.controls.barcode.setValue(rawValue);
        this.form.controls.barcode.markAsDirty();
        this.closeCameraScanner();
      });
      this.cameraScannerError = '';
    } catch (error) {
      this.cameraScannerError = getCameraAccessErrorMessage(error);
      console.error('Start camera scanner o popup thuoc failed', error);
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

  private async startImageCamera(): Promise<void> {
    const video = this.imageCameraVideo?.nativeElement;
    if (!video) {
      this.imageCameraError = 'Không mở được camera. Vui lòng thử lại.';
      this.imageCameraStarting = false;
      return;
    }

    try {
      this.imageCameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      video.srcObject = this.imageCameraStream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      this.imageCameraError = '';
    } catch (error) {
      this.imageCameraError = getCameraAccessErrorMessage(error);
      console.error('Start image camera o popup thuoc failed', error);
    } finally {
      this.imageCameraStarting = false;
    }
  }

  private stopImageCamera(): void {
    if (this.imageCameraStream) {
      this.imageCameraStream.getTracks().forEach((track) => track.stop());
      this.imageCameraStream = null;
    }

    const video = this.imageCameraVideo?.nativeElement;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  private revokeLocalImagePreviewObjectUrl(): void {
    if (this.localImagePreviewObjectUrl) {
      URL.revokeObjectURL(this.localImagePreviewObjectUrl);
      this.localImagePreviewObjectUrl = null;
    }
  }
}
