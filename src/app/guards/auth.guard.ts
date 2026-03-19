import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredPermission = route.data?.['permission'] as string | undefined;

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (!requiredPermission || authService.hasPermission(requiredPermission)) {
    return true;
  }

  return router.createUrlTree(['/bao-cao-thong-ke']);
};
