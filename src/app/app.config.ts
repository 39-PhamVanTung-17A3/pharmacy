import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { IconDefinition } from '@ant-design/icons-angular';
import {
  AlertOutline,
  AppstoreOutline,
  CameraOutline,
  CheckCircleOutline,
  DeleteOutline,
  EyeOutline,
  FileAddOutline,
  FileTextOutline,
  IdcardOutline,
  InboxOutline,
  LineChartOutline,
  LockOutline,
  LogoutOutline,
  MedicineBoxOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  PrinterOutline,
  QrcodeOutline,
  RobotOutline,
  ScanOutline,
  TeamOutline,
  UserAddOutline,
  WalletOutline
} from '@ant-design/icons-angular/icons';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { provideNzI18n, vi_VN } from 'ng-zorro-antd/i18n';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

const icons: IconDefinition[] = [
  MenuFoldOutline,
  MenuUnfoldOutline,
  LineChartOutline,
  RobotOutline,
  AppstoreOutline,
  MedicineBoxOutline,
  InboxOutline,
  AlertOutline,
  TeamOutline,
  EyeOutline,
  PrinterOutline,
  DeleteOutline,
  FileAddOutline,
  FileTextOutline,
  WalletOutline,
  IdcardOutline,
  LockOutline,
  LogoutOutline,
  ScanOutline,
  CameraOutline,
  UserAddOutline,
  QrcodeOutline,
  CheckCircleOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: NZ_ICONS, useValue: icons },
    provideNzI18n(vi_VN),
    { provide: LOCALE_ID, useValue: 'vi' }
  ]
};
