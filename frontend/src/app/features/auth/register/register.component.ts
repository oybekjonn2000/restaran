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
      <!-- Top Header Area with Gradient -->
      <div class="auth-header">
        <div class="header-top-row">
          <a routerLink="/client/restaurants" class="back-btn-icon" title="Asosiy menyuga qaytish">←</a>
          <span class="more-options">•••</span>
        </div>
        <h1 class="header-title">Mango<br>Food Register</h1>
      </div>

      <!-- Main Form Sheet -->
      <div class="auth-sheet animate-slide-up">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <!-- Name field -->
          <div class="form-group-new">
            <label class="form-label-new">To'liq ism</label>
            <div class="input-container-new">
              <input formControlName="name" type="text" class="form-control-new" placeholder="Ismingiz" id="reg-name">
              @if (form.get('name')?.valid) {
                <span class="field-icon success-check">✓</span>
              }
            </div>
            @if (form.get('name')?.touched && form.get('name')?.invalid) {
              <span class="error-msg-new">Ismingizni kiriting</span>
            }
          </div>

          <!-- Email field -->
          <div class="form-group-new">
            <label class="form-label-new">Email <span class="optional-badge">(ixtiyoriy)</span></label>
            <div class="input-container-new">
              <input formControlName="email" type="email" class="form-control-new" placeholder="email@manzil.uz" id="reg-email">
              @if (form.get('email')?.valid && form.get('email')?.value) {
                <span class="field-icon success-check">✓</span>
              }
            </div>
            @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
              <span class="error-msg-new">To'g'ri email kiriting</span>
            }
          </div>

          <!-- Phone field -->
          <div class="form-group-new">
            <label class="form-label-new">Telefon <span class="optional-badge">(ixtiyoriy)</span></label>
            <div class="input-container-new">
              <input formControlName="phone" type="tel" class="form-control-new" placeholder="+998901234567" id="reg-phone">
              @if (form.get('phone')?.valid && form.get('phone')?.value) {
                <span class="field-icon success-check">✓</span>
              }
            </div>
          </div>

          <!-- Address field -->
          <div class="form-group-new">
            <label class="form-label-new">Manzil <span class="optional-badge">(ixtiyoriy)</span></label>
            <div class="input-container-new">
              <input formControlName="address" type="text" class="form-control-new" placeholder="Shahar, ko'cha, uy" id="reg-address">
              @if (form.get('address')?.valid && form.get('address')?.value) {
                <span class="field-icon success-check">✓</span>
              }
            </div>
          </div>

          <!-- Password field -->
          <div class="form-group-new">
            <label class="form-label-new">Parol</label>
            <div class="input-container-new">
              <input
                formControlName="password"
                [type]="showPwd ? 'text' : 'password'"
                class="form-control-new"
                placeholder="Kamida 6 ta belgi"
                id="reg-password">
              <button type="button" class="field-icon eye-toggle" (click)="showPwd = !showPwd">
                {{ showPwd ? '🙈' : '👁️' }}
              </button>
            </div>
            @if (form.get('password')?.touched && form.get('password')?.errors?.['minlength']) {
              <span class="error-msg-new">Parol kamida 6 ta belgi bo'lsin</span>
            }
          </div>

          @if (errorMsg) {
            <div class="alert-error-new">⚠️ {{ errorMsg }}</div>
          }

          <!-- Submit Button -->
          <button type="submit" class="btn-signin-gradient" [disabled]="loading">
            @if (loading) {
              <mat-spinner diameter="20" color="accent"></mat-spinner>
              YUKLANMOQDA...
            } @else {
              RO'YXATDAN O'TISH
            }
          </button>
        </form>

        <!-- Footer -->
        <div class="footer-row-new">
          <span class="footer-text">Hisobingiz bormi ?</span>
          <a routerLink="/auth/login" class="signup-link">KIRISH</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #0f172a;
      font-family: 'Poppins', sans-serif;
      position: relative;
    }

    .auth-header {
      padding: 40px 24px 70px 24px;
      background: linear-gradient(135deg, #f97316 0%, #0f172a 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .header-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .back-btn-icon {
      color: #fff;
      font-size: 1.5rem;
      text-decoration: none;
      font-weight: bold;
      transition: transform 0.2s;
    }
    .back-btn-icon:hover {
      transform: translateX(-3px);
    }
    .more-options {
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.8;
      letter-spacing: 2px;
    }
    .header-title {
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1.25;
      margin: 0;
      letter-spacing: 0.5px;
    }

    .auth-sheet {
      flex: 1;
      background: #0f172a;
      border-radius: 40px 40px 0 0;
      margin-top: -30px;
      padding: 36px 28px;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
      z-index: 10;
      display: flex;
      flex-direction: column;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
    }

    .form-group-new {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-label-new {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
      transition: color 0.2s ease;
    }
    .form-group-new:focus-within .form-label-new {
      color: #f97316;
    }
    .input-container-new {
      position: relative;
      display: flex;
      align-items: center;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 0 16px;
      transition: all 0.25s ease;
    }
    .input-container-new:focus-within {
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
    }
    .form-control-new {
      width: 100%;
      background: transparent;
      border: none;
      padding: 14px 0;
      font-size: 0.95rem;
      color: #f1f5f9;
      outline: none;
      font-family: 'Poppins', sans-serif;
    }
    .form-control-new::placeholder {
      color: #475569;
    }
    .form-control-new:-webkit-autofill,
    .form-control-new:-webkit-autofill:hover, 
    .form-control-new:-webkit-autofill:focus, 
    .form-control-new:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
      -webkit-text-fill-color: #f1f5f9 !important;
      transition: background-color 5000s ease-in-out 0s;
    }
    .field-icon {
      position: absolute;
      right: 16px;
      font-size: 1.1rem;
      color: #64748b;
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .success-check {
      color: #10b981;
      font-weight: bold;
    }
    .eye-toggle {
      color: #94a3b8;
      transition: color 0.2s;
    }
    .eye-toggle:hover {
      color: #f97316;
    }
    .error-msg-new {
      font-size: 0.78rem;
      color: #ef4444;
      margin-top: 4px;
      padding-left: 4px;
    }
    .optional-badge {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 400;
      margin-left: 4px;
    }

    .alert-error-new {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.85rem;
      color: #ef4444;
      margin-bottom: 16px;
    }

    .btn-signin-gradient {
      width: 100%;
      height: 52px;
      border-radius: 26px;
      border: none;
      background: linear-gradient(90deg, #f97316 0%, #0f172a 100%);
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.35);
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: 'Poppins', sans-serif;
    }
    .btn-signin-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
    }
    .btn-signin-gradient:disabled {
      background: #475569;
      box-shadow: none;
      transform: none;
      cursor: not-allowed;
    }

    .footer-row-new {
      margin-top: auto;
      padding-top: 32px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
    }
    .footer-text {
      font-size: 0.85rem;
      color: #64748b;
    }
    .signup-link {
      font-size: 0.88rem;
      font-weight: 700;
      color: #f97316;
      text-decoration: none;
    }
    .signup-link:hover {
      text-decoration: underline;
    }

    .animate-slide-up {
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class RegisterComponent {
  form;
  loading = false;
  errorMsg = '';
  showPwd = false;
  selectedRole = 'CLIENT';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name:     ['', Validators.required],
      email:    ['', Validators.email],
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
      email:    v.email?.trim() || undefined,
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
