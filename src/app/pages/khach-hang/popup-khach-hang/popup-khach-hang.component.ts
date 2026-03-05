import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

export interface CustomerPayload {
  name: string;
  phone: string;
  address: string;
  loyaltyLevel: string;
}

@Component({
  selector: 'app-popup-khach-hang',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzButtonModule, NzFormModule, NzInputModule, NzModalModule, NzSelectModule],
  templateUrl: './popup-khach-hang.component.html',
  styleUrl: './popup-khach-hang.component.scss'
})
export class PopupKhachHangComponent {
  @Input() open = false;
  @Output() closePopup = new EventEmitter<void>();
  @Output() submitCustomer = new EventEmitter<CustomerPayload>();

  private readonly fb = inject(FormBuilder);

  readonly loyaltyOptions = ['Thường', 'Thân thiết', 'VIP'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    address: ['', [Validators.maxLength(250)]],
    loyaltyLevel: ['Thường', Validators.required]
  });

  close(): void {
    this.closePopup.emit();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.submitCustomer.emit({
      name: value.name.trim(),
      phone: value.phone.trim(),
      address: value.address.trim(),
      loyaltyLevel: value.loyaltyLevel
    });
    this.form.reset({
      name: '',
      phone: '',
      address: '',
      loyaltyLevel: 'Thường'
    });
    this.close();
  }
}
