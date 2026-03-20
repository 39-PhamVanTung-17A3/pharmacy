import { CommonModule } from '@angular/common';
import { getErrorMessage } from '../../../utils/error.util';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { KhachHang, KhachHangService } from '../khach-hang.service';

@Component({
  selector: 'app-popup-khach-hang',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzButtonModule, NzFormModule, NzInputModule, NzModalModule, NzNotificationModule],
  templateUrl: './popup-khach-hang.component.html',
  styleUrl: './popup-khach-hang.component.scss'
})
export class PopupKhachHangComponent implements OnChanges {
  @Input() open = false;
  @Input() editingCustomer: KhachHang | null = null;

  @Output() closePopup = new EventEmitter<void>();
  @Output() customerSaved = new EventEmitter<KhachHang>();

  private readonly fb = inject(FormBuilder);
  private readonly khachHangService = inject(KhachHangService);
  private readonly notification = inject(NzNotificationService);

  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    address: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  get isEditMode(): boolean {
    return this.editingCustomer !== null;
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
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.isSubmitting = true;
    try {
      const value = this.form.getRawValue();
      const name = value.name.trim();
      const phone = value.phone.trim();
      const address = value.address.trim();

      const saved = this.isEditMode
        ? await this.khachHangService.update(this.editingCustomer!.id, name, phone, address)
        : await this.khachHangService.create(name, phone, address);

      this.customerSaved.emit(saved);
      this.notification.success('Thành công', this.isEditMode ? 'Cập nhật khách hàng thành công' : 'Thêm khách hàng thành công');
      this.form.reset();
      this.closePopup.emit();
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Save khách hàng failed', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private syncFormWithMode(): void {
    if (this.editingCustomer) {
      this.form.setValue({
        name: this.editingCustomer.name,
        phone: this.editingCustomer.phone,
        address: this.editingCustomer.address
      });
      return;
    }

    this.form.reset({
      name: '',
      phone: '',
      address: ''
    });
  }
}
