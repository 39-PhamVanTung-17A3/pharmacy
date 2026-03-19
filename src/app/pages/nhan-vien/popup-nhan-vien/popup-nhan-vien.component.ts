import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NhanVienRole, ROLE_OPTIONS, parseNhanVienRole } from '../../../models/role.enum';
import { getErrorMessage } from '../../../utils/error.util';
import { NhanVien, NhanVienService } from '../nhan-vien.service';

@Component({
  selector: 'app-popup-nhan-vien',
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
  templateUrl: './popup-nhan-vien.component.html',
  styleUrl: './popup-nhan-vien.component.scss'
})
export class PopupNhanVienComponent implements OnChanges {
  @Input() open = false;
  @Input() editingEmployee: NhanVien | null = null;

  @Output() closePopup = new EventEmitter<void>();
  @Output() employeeSaved = new EventEmitter<NhanVien>();

  private readonly fb = inject(FormBuilder);
  private readonly nhanVienService = inject(NhanVienService);
  private readonly notification = inject(NzNotificationService);

  isSubmitting = false;

  readonly roleOptions = ROLE_OPTIONS;
  readonly shiftOptions = ['Hành chính', 'Ca sáng', 'Ca chiều', 'Ca tối'];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    role: [NhanVienRole.MANAGER, Validators.required],
    shift: ['', Validators.required]
  });

  get isEditMode(): boolean {
    return this.editingEmployee !== null;
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
      const role = value.role;
      const shift = value.shift.trim();

      const saved = this.isEditMode
        ? await this.nhanVienService.update(this.editingEmployee!.id, name, phone, role, shift)
        : await this.nhanVienService.create(name, phone, role, shift);

      this.employeeSaved.emit(saved);
      this.notification.success('Thành công', this.isEditMode ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công');
      this.form.reset();
      this.closePopup.emit();
    } catch (error) {
      const message = getErrorMessage(error);
      this.notification.error('Thất bại', message);
      console.error('Save nhân viên failed', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private syncFormWithMode(): void {
    if (this.editingEmployee) {
      this.form.setValue({
        name: this.editingEmployee.name,
        phone: this.editingEmployee.phone,
        role: this.normalizeRoleValue(this.editingEmployee.role),
        shift: this.editingEmployee.shift
      });
      return;
    }

    this.form.reset({
      name: '',
      phone: '',
      role: NhanVienRole.MANAGER,
      shift: ''
    });
  }

  private normalizeRoleValue(role: NhanVienRole): NhanVienRole {
    return parseNhanVienRole(role) ?? NhanVienRole.MANAGER;
  }
}
