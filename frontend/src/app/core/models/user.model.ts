export interface User {
  id: number;
  name: string;
  email: string;
  role: 'CLIENT' | 'COURIER' | 'ADMIN' | 'MANAGER';
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role?: string;
}

export interface CourierStats {
  id: number;
  name: string;
  email: string;
  phone?: string;
  isBusy: boolean;
  completedOrdersCount: number;
  totalEarnings: number;
}

export interface ClientStats {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalOrdersCount: number;
  totalSpent: number;
}
