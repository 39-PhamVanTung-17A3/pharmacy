import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NzLayoutModule, NzMenuModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  private readonly authService = inject(AuthService);

  get session() {
    return this.authService.session;
  }

  can(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
