import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { redirectByRole } from '../../../core/guards/auth.guard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="bg-circle c1"></div>
        <div class="bg-circle c2"></div>
        <div class="bg-circle c3"></div>
      </div>

      <div class="auth-card animate-in">
        <!-- Logo -->
        <div class="auth-logo">
          <span class="logo-icon">🍽️</span>
          <h1 class="logo-text">Food<span>Delivery</span></h1>
        </div>

        <div style="margin-bottom: 16px; display: flex; justify-content: flex-start;">
          <a routerLink="/client/restaurants" class="link" style="text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
            ⬅️ Asosiy menyuga qaytish
          </a>
        </div>

        <h2 class="auth-title">Xush kelibsiz!</h2>
        <p class="auth-subtitle">Hisobingizga kiring</p>

        <!-- Demo accounts -->
        <div class="demo-accounts">
          <p class="demo-label">⚡ Tezkor kirish:</p>
          <div class="demo-btns">
            <button (click)="fillDemo('client')" class="demo-btn client">🛒 Mijoz</button>
            <button (click)="fillDemo('courier')" class="demo-btn courier">🏍️ Kuryer</button>
            <button (click)="fillDemo('admin')" class="demo-btn admin">👨‍🍳 Admin</button>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label">📧 Email</label>
            <input
              formControlName="email"
              type="email"
              class="form-control"
              placeholder="email@manzil.uz"
              id="login-email">
            @if (form.get('email')?.touched && form.get('email')?.invalid) {
              <span class="error">To'g'ri email kiriting</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">🔒 Parol</label>
            <div class="input-wrap">
              <input
                formControlName="password"
                [type]="showPwd ? 'text' : 'password'"
                class="form-control"
                placeholder="Parolni kiriting"
                id="login-password">
              <button type="button" class="eye-btn" (click)="showPwd = !showPwd">
                {{ showPwd ? '🙈' : '👁️' }}
              </button>
            </div>
            @if (form.get('password')?.touched && form.get('password')?.invalid) {
              <span class="error">Parol kiriting</span>
            }
          </div>

          @if (errorMsg) {
            <div class="alert-error">⚠️ {{ errorMsg }}</div>
          }

          <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading">
            @if (loading) {
              <mat-spinner diameter="20" color="accent"></mat-spinner>
              Kirilmoqda...
            } @else {
              Kirish →
            }
          </button>
        </form>

        <p class="auth-footer">
          Hali hisobingiz yo'qmi?
          <a routerLink="/auth/register" class="link">Ro'yxatdan o'ting</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .auth-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .bg-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.08;
      animation: float 6s ease-in-out infinite;
    }

    .c1 { width: 400px; height: 400px; background: var(--primary); top: -100px; right: -100px; }
    .c2 { width: 300px; height: 300px; background: #8b5cf6; bottom: -80px; left: -80px; animation-delay: -2s; }
    .c3 { width: 200px; height: 200px; background: #3b82f6; top: 50%; left: 10%; animation-delay: -4s; }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-20px); }
    }

    .auth-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow-lg);
      position: relative;
      z-index: 1;
    }

    .auth-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }

    .logo-icon { font-size: 2rem; }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text);
    }
    .logo-text span { color: var(--primary); }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }

    .auth-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 20px;
    }

    .demo-accounts {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 16px;
      margin-bottom: 20px;
    }

    .demo-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .demo-btns {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .demo-btn {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: var(--transition);
      font-family: 'Poppins', sans-serif;
    }

    .demo-btn.client   { background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.3); }
    .demo-btn.courier  { background: rgba(139,92,246,0.15); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); }
    .demo-btn.admin    { background: rgba(59,130,246,0.15); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
    .demo-btn:hover    { transform: scale(1.05); }

    .auth-form { display: flex; flex-direction: column; gap: 4px; }

    .input-wrap {
      position: relative;
    }

    .eye-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
    }

    .error {
      font-size: 0.78rem;
      color: var(--danger);
      margin-top: 4px;
    }

    .alert-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: var(--radius);
      padding: 10px 14px;
      font-size: 0.875rem;
      color: #ef4444;
      margin-bottom: 8px;
    }

    .submit-btn {
      width: 100%;
      justify-content: center;
      padding: 14px;
      font-size: 1rem;
      margin-top: 8px;
      gap: 10px;
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .auth-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .link {
      color: var(--primary);
      font-weight: 600;
      cursor: pointer;
    }

    .link:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  form;
  loading = false;
  errorMsg = '';
  showPwd = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  fillDemo(role: 'client' | 'courier' | 'admin'): void {
    const map = {
      client:  { email: 'client@food.uz',  password: 'client123' },
      courier: { email: 'courier@food.uz', password: 'courier123' },
      admin:   { email: 'admin@food.uz',   password: 'admin123' },
    };
    this.form.patchValue(map[role]);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const { email, password } = this.form.value;
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData || undefined;

    this.authService.login({ email: email!, password: password!, initData }).subscribe({
      next: (res) => {
        this.loading = false;
        redirectByRole(this.authService, this.router);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Email yoki parol noto\'g\'ri!';
      }
    });
  }
}
