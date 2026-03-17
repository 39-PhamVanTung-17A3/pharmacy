import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
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
export class PopupNhapHangComponent implements OnInit, OnChanges {
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

  readonly form = this.fb.nonNullable.group({
    medicineId: [0, [Validators.required, Validators.min(1)]],
    batchCode: ['', Validators.required],
    supplier: ['', [Validators.maxLength(160)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    importPrice: [0, [Validators.required, Validators.min(0)]],
    sellPrice: [0, [Validators.min(0)]],
    expiryDate: ['', Validators.required],
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
  }

  close(): void {
    if (this.isSubmitting) {
      return;
    }
    this.closePopup.emit();
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
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
      this.notification.success('Thành công', this.isEditMode ? 'Cập nhật phiếu nhập thành công' : 'Tạo phiếu nhập thành công');
      this.form.reset();
      this.closePopup.emit();
    } catch (error) {
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại'
          : error instanceof Error
            ? error.message
            : 'Có lỗi xảy ra, vui lòng thử lại';
      this.notification.error('Thất bại', message);
      console.error('Save nhập hàng failed', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private syncFormWithMode(): void {
    if (this.editingImport) {
      this.form.setValue({
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
      medicineId: 0,
      batchCode: '',
      supplier: '',
      quantity: 0,
      importPrice: 0,
      sellPrice: 0,
      expiryDate: '',
      importedAt: ''
    });
  }

  private async loadMedicineOptions(): Promise<void> {
    try {
      const response = await this.thuocService.findAll(1, 1000);
      this.medicineOptions = response.items;
    } catch (error) {
      this.medicineOptions = [];
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.message || 'Không tải được danh sách thuốc'
          : error instanceof Error
            ? error.message
            : 'Không tải được danh sách thuốc';
      this.notification.error('Thất bại', message);
      console.error('Load danh sách thuốc failed', error);
    }
  }
}
