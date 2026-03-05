import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

export interface EmployeePayload {
  name: string;
  phone: string;
  role: string;
  shift: string;
}

@Component({
  selector: 'app-popup-nhan-vien',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzButtonModule, NzFormModule, NzInputModule, NzModalModule, NzSelectModule],
  templateUrl: './popup-nhan-vien.component.html',
  styleUrl: './popup-nhan-vien.component.scss'
})
export class PopupNhanVienComponent {
  @Input() open = false;
  @Output() closePopup = new EventEmitter<void>();
  @Output() submitEmployee = new EventEmitter<EmployeePayload>();

  private readonly fb = inject(FormBuilder);

  readonly roleOptions = ['Quản lý', 'Dược sĩ', 'Thu ngân', 'Kho vận'];
  readonly shiftOptions = ['Hành chính', 'Ca sáng', 'Ca chiều', 'Ca tối'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    role: ['', Validators.required],
    shift: ['', Validators.required]
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
    this.submitEmployee.emit({
      name: value.name.trim(),
      phone: value.phone.trim(),
      role: value.role,
      shift: value.shift
    });
    this.form.reset({
      name: '',
      phone: '',
      role: '',
      shift: ''
    });
    this.close();
  }
}
