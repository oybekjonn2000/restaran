export interface User {
  id: number;
  name: string;
  email?: string;
  role: 'CLIENT' | 'COURIER' | 'ADMIN' | 'MANAGER';
  phone?: string;
  address?: string;
  balance?: number;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  name: string;
  email?: string;
  role: string;
  phone?: string;
  address?: string;
  balance?: number;
  rememberMe?: boolean;
}

export interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
  initData?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  surname?: string;
  email?: string;
  password: string;
  phone?: string;
  otpCode?: string;
  address?: string;
  house?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  role?: string;
  restaurantIds?: number[];
}

export interface OtpRequest {
  phone: string;
  purpose: 'REGISTER' | 'RESET_PASSWORD';
  telegramId?: number;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
  purpose: 'REGISTER' | 'RESET_PASSWORD';
}

export interface ResetPasswordOtpRequest {
  phone: string;
  code: string;
  newPassword: string;
}

export interface CourierStats {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  isBusy: boolean;
  completedOrdersCount: number;
  totalEarnings: number;
}

export interface ClientStats {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalOrdersCount: number;
  totalSpent: number;
}

export interface ManagerStats {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  restaurantName: string;
  restaurantId?: number;
  restaurantIds?: number[];
  restaurantOrdersCount: number;
}
