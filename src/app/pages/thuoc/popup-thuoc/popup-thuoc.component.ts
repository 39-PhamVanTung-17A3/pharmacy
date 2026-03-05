import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

export interface MedicinePayload {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  expiryDate: string;
}

@Component({
  selector: 'app-popup-thuoc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSelectModule
  ],
  templateUrl: './popup-thuoc.component.html',
  styleUrl: './popup-thuoc.component.scss'
})
export class PopupThuocComponent {
  @Input() open = false;
  @Output() closePopup = new EventEmitter<void>();
  @Output() submitMedicine = new EventEmitter<MedicinePayload>();

  private readonly fb = inject(FormBuilder);

  readonly categoryOptions = ['Kháng sinh', 'Giảm đau', 'Vitamin'];
  readonly unitOptions = ['Viên', 'Vỉ', 'Hộp', 'Chai'];

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    category: this.fb.nonNullable.control('', Validators.required),
    unit: this.fb.nonNullable.control('', Validators.required),
    expiryDate: this.fb.control<Date | null>(null, Validators.required)
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
    if (!value.expiryDate) {
      return;
    }

    this.submitMedicine.emit({
      name: value.name.trim(),
      category: value.category,
      unit: value.unit,
      quantity: 0,
      expiryDate: this.formatDate(value.expiryDate)
    });

    this.form.reset({
      name: '',
      category: '',
      unit: '',
      expiryDate: null
    });
    this.close();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
