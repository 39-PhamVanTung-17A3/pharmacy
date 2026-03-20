import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { DanhMucThuoc, DanhMucThuocService } from '../danh-muc-thuoc.service';
import { getErrorMessage } from '../../../utils/error.util';

@Component({
  selector: 'app-popup-danh-muc-thuoc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzNotificationModule
  ],
  templateUrl: './popup-danh-muc-thuoc.component.html',
  styleUrl: './popup-danh-muc-thuoc.component.scss'
})
export class PopupDanhMucThuocComponent implements OnChanges {
  @Input() open = false;
  @Input() editingCategory: DanhMucThuoc | null = null;

  @Output() closePopup = new EventEmitter<void>();
  @Output() categorySaved = new EventEmitter<DanhMucThuoc>();

  private readonly fb = inject(FormBuilder);
  private readonly danhMucThuocService = inject(DanhMucThuocService);
  private readonly notification = inject(NzNotificationService);

  isSubmitting = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(300)]]
  });

  get isEditMode(): boolean {
    return this.editingCategory !== null;
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
    const value = this.form.getRawValue();
    const name = value.name.trim();
    const description = value.description.trim();

    try {
      const saved = this.isEditMode
        ? await this.danhMucThuocService.update(this.editingCategory!.id, name, description)
        : await this.danhMucThuocService.create(name, description);

      this.categorySaved.emit(saved);
      this.notification.success('Thành công', this.isEditMode ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công');
      this.form.reset();
      this.closePopup.emit();
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Save danh mục thuốc failed', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private syncFormWithMode(): void {
    if (this.editingCategory) {
      this.form.setValue({
        name: this.editingCategory.name,
        description: this.editingCategory.description || ''
      });
      return;
    }

    this.form.reset({
      name: '',
      description: ''
    });
  }
}
