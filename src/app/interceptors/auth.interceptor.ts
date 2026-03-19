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

  const accessToken = authService.accessToken;
  const authReq =
    !accessToken || isLoginApi || isRefreshApi
      ? req
      : req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        });

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
                Authorization: `Bearer ${newAccessToken}`
              }
            });
            return next(retryReq);
          })
        );
      }

      if (error.status === 0 && !isAuthApi) {
        authService.clearSession();
        void router.navigateByUrl('/login');
      }

      return throwError(() => error);
    })
  );
};
