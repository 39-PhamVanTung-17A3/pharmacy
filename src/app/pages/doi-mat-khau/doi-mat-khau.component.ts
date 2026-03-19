import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { MenuComponent } from '../../components/menu/menu.component';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/error.util';

@Component({
  selector: 'app-doi-mat-khau',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzBreadCrumbModule, NzCardModule, NzInputModule, NzButtonModule, NzIconModule, MenuComponent],
  templateUrl: './doi-mat-khau.component.html',
  styleUrl: './doi-mat-khau.component.scss'
})
export class DoiMatKhauComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NzNotificationService);

  loading = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    confirmPassword: ['', [Validators.required]]
  });

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.notification.warning('Cảnh báo', 'Xác nhận mật khẩu không khớp');
      return;
    }

    this.loading = true;
    try {
      await this.authService.changePassword(currentPassword, newPassword);
      this.notification.success('Thành công', 'Đổi mật khẩu thành công');
      this.form.reset();
    } catch (error) {
      this.notification.error('Thất bại', getErrorMessage(error, 'Đổi mật khẩu thất bại'));
    } finally {
      this.loading = false;
    }
  }
}
