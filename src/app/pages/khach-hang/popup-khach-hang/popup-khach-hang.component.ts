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

  get showNameError(): boolean {
    const control = this.form.controls.name;
    return control.invalid && (control.touched || control.dirty);
  }

  get showPhoneError(): boolean {
    const control = this.form.controls.phone;
    return control.invalid && (control.touched || control.dirty);
  }

  get showAddressError(): boolean {
    const control = this.form.controls.address;
    return control.invalid && (control.touched || control.dirty);
  }

  get nameErrorMessage(): string {
    const control = this.form.controls.name;
    if (control.hasError('required')) {
      return 'Vui lòng nhập tên khách hàng';
    }
    if (control.hasError('maxlength')) {
      return 'Tên khách hàng tối đa 120 ký tự';
    }
    return '';
  }

  get phoneErrorMessage(): string {
    const control = this.form.controls.phone;
    if (control.hasError('required')) {
      return 'Vui lòng nhập số điện thoại';
    }
    if (control.hasError('maxlength')) {
      return 'Số điện thoại tối đa 20 ký tự';
    }
    return '';
  }

  get addressErrorMessage(): string {
    const control = this.form.controls.address;
    if (control.hasError('required')) {
      return 'Vui lòng nhập địa chỉ khách hàng';
    }
    if (control.hasError('maxlength')) {
      return 'Địa chỉ tối đa 1000 ký tự';
    }
    return '';
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
