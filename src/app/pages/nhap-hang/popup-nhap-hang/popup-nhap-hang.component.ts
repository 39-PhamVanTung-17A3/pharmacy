import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';

export interface ImportPayload {
  medicineName: string;
  supplier: string;
  quantity: number;
  importPrice: number;
  sellPrice: number;
  expiryDate: string;
  importedAt: string;
}

@Component({
  selector: 'app-popup-nhap-hang',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzButtonModule, NzFormModule, NzInputModule, NzInputNumberModule, NzModalModule],
  templateUrl: './popup-nhap-hang.component.html',
  styleUrl: './popup-nhap-hang.component.scss'
})
export class PopupNhapHangComponent {
  @Input() open = false;
  @Output() closePopup = new EventEmitter<void>();
  @Output() submitImport = new EventEmitter<ImportPayload>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    medicineName: ['', [Validators.required, Validators.maxLength(120)]],
    supplier: ['', [Validators.required, Validators.maxLength(160)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    importPrice: [0, [Validators.required, Validators.min(0)]],
    sellPrice: [0, [Validators.required, Validators.min(0)]],
    expiryDate: ['', Validators.required],
    importedAt: ['', Validators.required]
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
    this.submitImport.emit({
      medicineName: value.medicineName.trim(),
      supplier: value.supplier.trim(),
      quantity: Number(value.quantity) || 0,
      importPrice: Number(value.importPrice) || 0,
      sellPrice: Number(value.sellPrice) || 0,
      expiryDate: value.expiryDate,
      importedAt: value.importedAt
    });
    this.form.reset({
      medicineName: '',
      supplier: '',
      quantity: 0,
      importPrice: 0,
      sellPrice: 0,
      expiryDate: '',
      importedAt: ''
    });
    this.close();
  }
}
