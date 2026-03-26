import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoginApi = req.url.endsWith('/api/auth/login');
  const isRefreshApi = req.url.endsWith('/api/auth/refresh');
  const isAuthApi = req.url.includes('/api/auth/');
  const isNgrokApi = req.url.includes('.ngrok-free.app') || req.url.includes('.ngrok-free.dev');

  const accessToken = authService.accessToken;
  const baseHeaders: Record<string, string> = {};
  if (isNgrokApi) {
    baseHeaders['ngrok-skip-browser-warning'] = 'true';
  }
  if (accessToken && !isLoginApi && !isRefreshApi) {
    baseHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const authReq = Object.keys(baseHeaders).length ? req.clone({ setHeaders: baseHeaders }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if ((error.status === 401 || error.status === 403) && !isAuthApi) {
        return from(authService.refreshAccessToken()).pipe(
          switchMap((newAccessToken) => {
            if (!newAccessToken) {
              authService.clearSession();
              void router.navigateByUrl('/login');
              return throwError(() => error);
            }
            const retryReq = req.clone({
              setHeaders: {
                ...(isNgrokApi ? { 'ngrok-skip-browser-warning': 'true' } : {}),
                Authorization: `Bearer ${newAccessToken}`
              }
            });
            return next(retryReq);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
