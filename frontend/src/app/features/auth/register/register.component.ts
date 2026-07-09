import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { redirectByRole } from '../../../core/guards/auth.guard';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="bg-circle c1"></div>
        <div class="bg-circle c2"></div>
      </div>

      <div class="auth-card animate-in">
        <div class="auth-logo">
          <span>🍽️</span>
          <h1 class="logo-text">Food<span>Delivery</span></h1>
        </div>

        <div style="margin-bottom: 16px; display: flex; justify-content: flex-start;">
          <a routerLink="/client/restaurants" class="link" style="text-decoration: none; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
            ⬅️ Asosiy menyuga qaytish
          </a>
        </div>

        <h2 class="auth-title">Ro'yxatdan o'ting</h2>
        <p class="auth-subtitle">Yangi hisob yarating</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label">👤 To'liq ism</label>
            <input formControlName="name" type="text" class="form-control" placeholder="Ismingiz" id="reg-name">
          </div>

          <div class="form-group">
            <label class="form-label">📧 Email</label>
            <input formControlName="email" type="email" class="form-control" placeholder="email@manzil.uz" id="reg-email">
          </div>

          <div class="form-group">
            <label class="form-label">📱 Telefon (ixtiyoriy)</label>
            <input formControlName="phone" type="tel" class="form-control" placeholder="+998 90 123 45 67" id="reg-phone">
          </div>

          <div class="form-group">
            <label class="form-label">📍 Manzil (ixtiyoriy)</label>
            <input formControlName="address" type="text" class="form-control" placeholder="Shahar, ko'cha, uy" id="reg-address">
          </div>

          <div class="form-group">
            <label class="form-label">🔒 Parol</label>
            <input formControlName="password" type="password" class="form-control" placeholder="Kamida 6 ta belgi" id="reg-password">
            @if (form.get('password')?.touched && form.get('password')?.errors?.['minlength']) {
              <span class="error">Parol kamida 6 ta belgi bo'lsin</span>
            }
          </div>



          @if (errorMsg) {
            <div class="alert-error">⚠️ {{ errorMsg }}</div>
          }

          <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading">
            @if (loading) {
              <mat-spinner diameter="20" color="accent"></mat-spinner>
            }
            Ro'yxatdan o'tish
          </button>
        </form>

        <p class="auth-footer">
          Hisobingiz bormi?
          <a routerLink="/auth/login" class="link">Kiring</a>
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
    .auth-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .bg-circle { position: absolute; border-radius: 50%; opacity: 0.08; }
    .c1 { width: 400px; height: 400px; background: #8b5cf6; top: -100px; left: -100px; }
    .c2 { width: 300px; height: 300px; background: var(--primary); bottom: -80px; right: -80px; }

    .auth-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 36px;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-lg);
      position: relative;
      z-index: 1;
    }

    .auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; font-size: 1.8rem; }
    .logo-text { font-size: 1.4rem; font-weight: 800; }
    .logo-text span { color: var(--primary); }
    .auth-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
    .auth-subtitle { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 20px; }

    .auth-form { display: flex; flex-direction: column; }

    .role-select { margin-bottom: 16px; }
    .role-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .role-btn {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: 2px solid var(--border);
      background: var(--bg-card2);
      color: var(--text-muted);
      transition: var(--transition);
      font-family: 'Poppins', sans-serif;
    }
    .role-btn.active, .role-btn:hover {
      border-color: var(--primary);
      background: rgba(249,115,22,0.1);
      color: var(--primary);
    }

    .error { font-size: 0.78rem; color: var(--danger); margin-top: 2px; }
    .alert-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: var(--radius);
      padding: 10px 14px;
      font-size: 0.875rem;
      color: #ef4444;
      margin-bottom: 8px;
    }
    .submit-btn { width: 100%; justify-content: center; padding: 14px; font-size: 1rem; gap: 8px; }
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .auth-footer { text-align: center; margin-top: 20px; font-size: 0.875rem; color: var(--text-muted); }
    .link { color: var(--primary); font-weight: 600; }
    .link:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent {
  form;
  loading = false;
  errorMsg = '';
  selectedRole = 'CLIENT';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      phone:    [''],
      address:  [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    this.errorMsg = '';

    const v = this.form.value;
    this.authService.register({
      name:     v.name!,
      email:    v.email!,
      password: v.password!,
      phone:    v.phone || undefined,
      address:  v.address || undefined,
      role:     this.selectedRole
    }).subscribe({
      next: () => {
        this.loading = false;
        redirectByRole(this.authService, this.router);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Xatolik yuz berdi!';
      }
    });
  }
}
