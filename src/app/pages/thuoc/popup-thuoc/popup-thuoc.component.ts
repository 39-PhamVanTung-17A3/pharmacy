import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { DanhMucThuoc, DanhMucThuocService } from '../../danh-muc-thuoc/danh-muc-thuoc.service';
import { Thuoc, ThuocService } from '../thuoc.service';

@Component({
  selector: 'app-popup-thuoc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzSelectModule,
    NzNotificationModule
  ],
  templateUrl: './popup-thuoc.component.html',
  styleUrl: './popup-thuoc.component.scss'
})
export class PopupThuocComponent implements OnInit, OnChanges {
  @Input() open = false;
  @Input() editingMedicine: Thuoc | null = null;

  @Output() closePopup = new EventEmitter<void>();
  @Output() medicineSaved = new EventEmitter<Thuoc>();

  private readonly fb = inject(FormBuilder);
  private readonly danhMucThuocService = inject(DanhMucThuocService);
  private readonly thuocService = inject(ThuocService);
  private readonly notification = inject(NzNotificationService);

  categoryOptions: DanhMucThuoc[] = [];
  isSubmitting = false;

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    category: this.fb.control<DanhMucThuoc | null>(null, Validators.required),
    unit: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)])
  });

  get isEditMode(): boolean {
    return this.editingMedicine !== null;
  }

  async ngOnInit(): Promise<void> {
    await this.loadCategoryOptions();
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
      const category = value.category;
      const unit = value.unit.trim();

      if (!category) {
        this.form.controls.category.markAsTouched();
        return;
      }

      const saved = this.isEditMode
        ? await this.thuocService.update(this.editingMedicine!.id, name, category.id, unit)
        : await this.thuocService.create(name, category.id, unit);

      this.medicineSaved.emit(saved);
      this.notification.success('Thành công', this.isEditMode ? 'Cập nhật thuốc thành công' : 'Thêm thuốc thành công');
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
      console.error('Save thuốc failed', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async loadCategoryOptions(): Promise<void> {
    try {
      const response = await this.danhMucThuocService.findAll(1, 1000);
      this.categoryOptions = response.items;
    } catch (error) {
      this.categoryOptions = [];
      const message =
        error instanceof HttpErrorResponse
          ? error.error?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại'
          : error instanceof Error
            ? error.message
            : 'Có lỗi xảy ra, vui lòng thử lại'; this.notification.error('Thất bại', message); this.notification.error('Thất bại', message);
      console.error('Load danh mục trong popup thuốc failed', error);
    }
  }

  private syncFormWithMode(): void {
    if (this.editingMedicine) {
      const selectedCategory =
        this.categoryOptions.find((item) => item.id === this.editingMedicine!.category.id) ??
        ({
          id: this.editingMedicine.category.id,
          name: this.editingMedicine.category.name,
          description: this.editingMedicine.category.description
        } as DanhMucThuoc);

      this.form.setValue({
        name: this.editingMedicine.name,
        category: selectedCategory,
        unit: this.editingMedicine.unit
      });
      return;
    }

    this.form.reset({
      name: '',
      category: null,
      unit: ''
    });
  }
}
