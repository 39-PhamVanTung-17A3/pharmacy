import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { DanhMucThuoc, DanhMucThuocService } from '../danh-muc-thuoc.service';
import { HttpErrorResponse } from '@angular/common/http';

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
      return;
    }

    this.isSubmitting = true;
    try {
      const value = this.form.getRawValue();
      const name = value.name.trim();
      const description = value.description.trim();

      const saved = this.isEditMode
        ? await this.danhMucThuocService.update(this.editingCategory!.id, name, description)
        : await this.danhMucThuocService.create(name, description);

      this.categorySaved.emit(saved);
      this.notification.success('Thanh cong', this.isEditMode ? 'Cap nhat danh muc thanh cong' : 'Them danh muc thanh cong');
      this.form.reset();
      this.closePopup.emit();
    } catch (error) {
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại'
          : error instanceof Error
            ? error.message
            : 'Có lỗi xảy ra, vui lòng thử lại';
      this.notification.error('That bai', message);
      console.error('Save danh muc thuoc failed', error);
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
