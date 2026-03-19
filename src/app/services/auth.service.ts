import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import { LoginResponse, UserSession } from '../models/auth.model';

const AUTH_STORAGE_KEY = 'pharmacy_auth_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.beDomain + '/api/auth';
  private readonly sessionSubject = new BehaviorSubject<UserSession | null>(this.readSessionFromStorage());
  private refreshPromise: Promise<string | null> | null = null;

  readonly session$ = this.sessionSubject.asObservable();

  get session(): UserSession | null {
    return this.sessionSubject.value;
  }

  get accessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  get refreshToken(): string | null {
    return this.session?.refreshToken ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  hasPermission(permission: string): boolean {
    return !!this.session?.permissions?.includes(permission);
  }

  async login(phone: string, password: string): Promise<UserSession> {
    const response = await firstValueFrom(
      this.http.post<BaseResponse<LoginResponse>>(`${this.apiUrl}/login`, {
        phone: phone.trim(),
        password
      })
    );

    const data = this.unwrapData(response);
    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Không nhận được access/refresh token');
    }

    const session: UserSession = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      phone: data.phone,
      name: data.name,
      role: data.role,
      permissions: data.permissions ?? []
    };
    this.setSession(session);
    return session;
  }

  async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshAccessToken().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await firstValueFrom(
          this.http.post<BaseResponse<null>>(`${this.apiUrl}/logout`, {
            refreshToken: this.refreshToken
          })
        );
      }
    } catch {
      // ignore and clear local session anyway
    } finally {
      this.clearSession();
      await this.router.navigateByUrl('/login');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<BaseResponse<null>>(`${this.apiUrl}/change-password`, {
        currentPassword,
        newPassword
      })
    );
    this.unwrapData(response);
  }

  clearSession(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.sessionSubject.next(null);
  }

  private async doRefreshAccessToken(): Promise<string | null> {
    const currentRefreshToken = this.refreshToken;
    if (!currentRefreshToken) {
      return null;
    }
    try {
      const response = await firstValueFrom(
        this.http.post<BaseResponse<LoginResponse>>(`${this.apiUrl}/refresh`, {
          refreshToken: currentRefreshToken
        })
      );
      const data = this.unwrapData(response);
      if (!data.accessToken || !data.refreshToken) {
        this.clearSession();
        return null;
      }

      const currentSession = this.session;
      const nextSession: UserSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        phone: data.phone || currentSession?.phone || '',
        name: data.name || currentSession?.name || '',
        role: data.role || currentSession?.role || '',
        permissions: data.permissions ?? currentSession?.permissions ?? []
      };
      this.setSession(nextSession);
      return nextSession.accessToken;
    } catch {
      this.clearSession();
      return null;
    }
  }

  private setSession(session: UserSession): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readSessionFromStorage(): UserSession | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as UserSession;
      if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.phone) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private unwrapData<T>(response: BaseResponse<T>): T {
    if (response.code === 0) {
      throw new Error(response.message || 'Yêu cầu thất bại');
    }
    return response.data;
  }
}
