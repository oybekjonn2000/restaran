import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { API_BASE } from '../config';
import { MatSnackBar } from '@angular/material/snack-bar';

const API = `${API_BASE}/api/auth`;
const TOKEN_KEY = 'food_token';
const USER_KEY = 'food_user';

@Injectable({ providedIn: 'root' })
export class AuthService {

  showSupportChat = signal<boolean>(false);

  private _user = signal<AuthResponse | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);
  readonly userId = computed(() => this._user()?.id ?? null);

  private idleTimer: any;
  private readonly IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  private activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.startIdleTracking();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/login`, request).pipe(
      tap(res => this.saveUser(res, request.rememberMe))
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

  updateProfile(name: string, phone: string, address: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${API}/profile`, { name, phone, address }).pipe(
      tap(res => {
        const current = this._user();
        if (current) {
          res.token = current.token;
        }
        this.saveUser(res);
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${API}/password`, { oldPassword, newPassword });
  }

  logout(): void {
    this.stopIdleTracking();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
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

  private saveUser(res: AuthResponse, rememberMe?: boolean): void {
    let storage: Storage = localStorage;
    if (rememberMe !== undefined) {
      storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem(TOKEN_KEY);
      otherStorage.removeItem(USER_KEY);
    } else {
      if (sessionStorage.getItem(TOKEN_KEY)) {
        storage = sessionStorage;
      }
    }

    res.rememberMe = rememberMe !== undefined ? rememberMe : (storage === localStorage);

    storage.setItem(TOKEN_KEY, res.token);
    storage.setItem(USER_KEY, JSON.stringify(res));
    this._user.set(res);
  }

  private loadUser(): AuthResponse | null {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const data = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!data || !token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      return null;
    }

    const user: AuthResponse = JSON.parse(data);

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      if (Date.now() >= exp) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        return null;
      }
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      return null;
    }

    return user;
  }

  resetIdleTimerExternally(): void {
    this.resetIdleTimer();
  }

  private resetIdleTimer = () => {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    const currentUser = this._user();
    if (currentUser && !currentUser.rememberMe) {
      this.idleTimer = setTimeout(() => {
        this.handleIdleTimeout();
      }, this.IDLE_TIMEOUT_MS);
    }
  };

  private handleIdleTimeout(): void {
    this.logout();
    this.snack.open("Sessiya muddati tugadi, qayta tizimga kiring.", "OK", {
      duration: 5000
    });
  }

  private startIdleTracking(): void {
    this.stopIdleTracking();
    const currentUser = this._user();
    if (currentUser && !currentUser.rememberMe) {
      this.activityEvents.forEach(event => {
        window.addEventListener(event, this.resetIdleTimer, { passive: true });
      });
      this.resetIdleTimer();
    }
  }

  private stopIdleTracking(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.activityEvents.forEach(event => {
      window.removeEventListener(event, this.resetIdleTimer);
    });
  }
}
