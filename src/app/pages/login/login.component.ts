import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../utils/error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzCardModule, NzInputModule, NzButtonModule, NzIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NzNotificationService);
  private readonly router = inject(Router);

  loading = false;
  showPassword = false;

  readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    password: ['', [Validators.required]]
  });

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      const { phone, password } = this.form.getRawValue();
      await this.authService.login(phone, password);
      this.notification.success('Thành công', 'Đăng nhập thành công');
      await this.router.navigateByUrl('/bao-cao-thong-ke');
    } catch (error) {
      this.notification.error('Thất bại', getErrorMessage(error, 'Đăng nhập thất bại'));
    } finally {
      this.loading = false;
    }
  }
}
