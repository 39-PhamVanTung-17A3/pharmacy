import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NzLayoutModule, NzMenuModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {}
