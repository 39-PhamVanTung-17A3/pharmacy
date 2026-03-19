export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string | null;
  refreshToken: string | null;
  phone: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  phone: string;
  name: string;
  role: string;
  permissions: string[];
}
