import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { API_BASE } from '../config';

const API = `${API_BASE}/api/auth`;
const TOKEN_KEY = 'food_token';
const USER_KEY = 'food_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private _user = signal<AuthResponse | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);
  readonly userId = computed(() => this._user()?.id ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/login`, request).pipe(
      tap(res => this.saveUser(res))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/register`, request).pipe(
      tap(res => this.saveUser(res))
    );
  }

  telegramLogin(initData: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/telegram`, { initData }).pipe(
      tap(res => this.saveUser(res))
    );
  }

  fetchMe(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${API}/me`).pipe(
      tap(res => {
        const current = this._user();
        if (current) {
          res.token = current.token;
        }
        this.saveUser(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isClient(): boolean {
    return this._user()?.role === 'CLIENT';
  }

  isCourier(): boolean {
    return this._user()?.role === 'COURIER';
  }

  isAdmin(): boolean {
    const role = this._user()?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

  private saveUser(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    this._user.set(res);
  }

  private loadUser(): AuthResponse | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}
