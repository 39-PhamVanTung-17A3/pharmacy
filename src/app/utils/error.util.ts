import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại'): string {
  if (error instanceof HttpErrorResponse) {
    return error.error?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}