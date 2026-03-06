import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { DanhMucThuoc, DanhMucThuocService } from '../../danh-muc-thuoc/danh-muc-thuoc.service';

export interface MedicinePayload {
  name: string;
  category: DanhMucThuoc;
  unit: string;
  quantity: number;
  // expiryDate: string;
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
export class PopupThuocComponent implements OnInit {
  @Input() open = false;
  @Output() closePopup = new EventEmitter<void>();
  @Output() submitMedicine = new EventEmitter<MedicinePayload>();

  private readonly fb = inject(FormBuilder);
  private readonly danhMucThuocService = inject(DanhMucThuocService);
  private readonly notification = inject(NzNotificationService);

  categoryOptions: DanhMucThuoc[] = [];
  readonly unitOptions = ['Viên', 'Vỉ', 'Hộp', 'Chai'];

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    category: this.fb.control<DanhMucThuoc | null>(null, Validators.required),
    unit: this.fb.nonNullable.control('', Validators.required),
    // expiryDate: this.fb.control<Date | null>(null, Validators.required)
  });

  async ngOnInit(): Promise<void> {
    await this.loadCategoryOptions();
  }

  close(): void {
    this.closePopup.emit();
  }

  private async loadCategoryOptions(): Promise<void> {
    try {
      const response = await this.danhMucThuocService.findAll(1, 1000);
      this.categoryOptions = response.items;
    } catch (error) {
      this.categoryOptions = [];
      const message = error instanceof Error ? error.message : 'Khong the tai danh muc thuoc';
      this.notification.error('That bai', message);
      console.error('Load danh muc trong popup thuoc failed', error);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    // if (!value.expiryDate) {
    //   return;
    // }

    this.submitMedicine.emit({
      name: value.name.trim(),
      category: value.category!,
      unit: value.unit,
      quantity: 0,
      // expiryDate: this.formatDate(value.expiryDate)
    });

    this.form.reset({
      name: '',
      category: null,
      unit: '',
      // expiryDate: null
    });
    this.close();
  }


}
