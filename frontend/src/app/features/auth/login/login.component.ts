import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { redirectByRole } from '../../../core/guards/auth.guard';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Top Header Area with Gradient -->
        <div class="auth-header">
          <div class="header-top-row">
            <a routerLink="/client/restaurants" class="back-btn-icon" title="Asosiy menyuga qaytish">←</a>
            <span class="more-options">•••</span>
          </div>
          <h1 class="header-title">Mango<br>Food Login</h1>
        </div>

        <!-- Main Form Sheet -->
        <div class="auth-sheet animate-slide-up">
          <!-- Demo Accounts (Subtle) -->
          <div class="demo-section">
            <span class="demo-label">⚡ Tezkor kirish:</span>
            <div class="demo-chips">
              <button type="button" (click)="fillDemo('client')" class="demo-chip client">Mijoz</button>
              <button type="button" (click)="fillDemo('courier')" class="demo-chip courier">Kuryer</button>
              <button type="button" (click)="fillDemo('admin')" class="demo-chip admin">Admin</button>
              <button type="button" (click)="fillDemo('manager10')" class="demo-chip manager">Manager</button>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <!-- Phone field -->
            <div class="form-group-new">
              <label class="form-label-new">Telefon raqam</label>
              <div class="input-container-new">
                <input
                  formControlName="phone"
                  type="tel"
                  class="form-control-new"
                  placeholder="+998901234567"
                  id="login-phone">
                @if (form.get('phone')?.valid) {
                  <span class="field-icon success-check">✓</span>
                }
              </div>
              @if (form.get('phone')?.touched && form.get('phone')?.invalid) {
                <span class="error-msg-new">Telefon raqamni kiriting</span>
              }
            </div>

            <!-- Password field -->
            <div class="form-group-new">
              <label class="form-label-new">Parol</label>
              <div class="input-container-new">
                <input
                  formControlName="password"
                  [type]="showPwd ? 'text' : 'password'"
                  class="form-control-new"
                  placeholder="••••••••"
                  id="login-password">
                <button type="button" class="field-icon eye-toggle" (click)="showPwd = !showPwd">
                  {{ showPwd ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.touched && form.get('password')?.invalid) {
                <span class="error-msg-new">Parol kiriting</span>
              }
            </div>

            <!-- Remember me & Forgot Password -->
            <div class="options-row-new">
              <label class="remember-label-new">
                <input type="checkbox" formControlName="rememberMe">
                <span>Eslab qolish</span>
              </label>
              <a class="forgot-link" (click)="openForgotModal()">Parol esdan chiqdimi ?</a>
            </div>

            @if (errorMsg) {
              <div class="alert-error-new">⚠️ {{ errorMsg }}</div>
            }

            <!-- Submit Button -->
            <button type="submit" class="btn-signin-gradient" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
                KIRILMOQDA...
              } @else {
                KIRISH
              }
            </button>
          </form>

          <!-- Footer -->
          <div class="footer-row-new">
            <span class="footer-text">Hisobingiz yo'qmi ?</span>
            <a routerLink="/auth/register" class="signup-link">RO'YXATDAN O'TISH</a>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= PAROLNI TIKLASH MODAL (FORGOT PASSWORD) ================= -->
    @if (showForgotModal) {
      <div class="modal-backdrop" (click)="closeForgotModal()">
        <div class="forgot-modal animate-slide-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>🔑 Parolni tiklash</h3>
            <button type="button" class="close-btn" (click)="closeForgotModal()">✕</button>
          </div>

          @if (forgotErrorMsg) {
            <div class="alert-error-new">⚠️ {{ forgotErrorMsg }}</div>
          }
          @if (forgotInfoMsg) {
            <div class="alert-info-new">ℹ️ {{ forgotInfoMsg }}</div>
          }

          <!-- STEP 1: Phone Entry -->
          @if (forgotStep === 1) {
            <p class="modal-desc">Telefon raqamingizni kiriting. SMS orqali 6 xonali tasdiqlash kodi yuboriladi.</p>
            <div class="form-group-new">
              <label class="form-label-new">Telefon raqam</label>
              <div class="input-container-new">
                <input
                  type="tel"
                  class="form-control-new"
                  placeholder="+998 90 123 45 67"
                  [value]="forgotFormattedPhone"
                  (input)="onForgotPhoneInput($event)">
              </div>
            </div>
            <button
              type="button"
              class="btn-signin-gradient"
              [disabled]="forgotLoading || !isForgotPhoneValid"
              (click)="sendForgotOtp()">
              @if (forgotLoading) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
                YUBORILMOQDA...
              } @else {
                SMS KOD YUBORISH →
              }
            </button>
          }

          <!-- STEP 2: OTP Entry -->
          @if (forgotStep === 2) {
            <p class="modal-desc"><strong>{{ forgotRawPhone }}</strong> raqamiga yuborilgan 6 xonali SMS kodni kiriting.</p>
            @if (forgotDevOtp) {
              <div class="dev-otp-banner">⚡ Test kodi: <strong>{{ forgotDevOtp }}</strong></div>
            }
            <div class="form-group-new">
              <label class="form-label-new">SMS Kod</label>
              <div class="input-container-new">
                <input
                  type="text"
                  maxlength="6"
                  class="form-control-new otp-input"
                  placeholder="123456"
                  [(ngModel)]="forgotOtpCode"
                  (ngModelChange)="onForgotOtpChange($event)">
              </div>
            </div>
            <div class="timer-row">
              @if (forgotTimerSeconds > 0) {
                <span class="timer-text">⏳ {{ formattedForgotTimer }}</span>
              } @else {
                <span class="timer-expired">⚠️ Kod muddati tugadi</span>
              }
              <button
                type="button"
                class="btn-resend"
                [disabled]="forgotLoading || forgotTimerSeconds > 0"
                (click)="sendForgotOtp()">
                🔄 Qaytadan yuborish
              </button>
            </div>
            <button
              type="button"
              class="btn-signin-gradient"
              [disabled]="forgotLoading || forgotOtpCode.length < 6"
              (click)="verifyForgotOtp()">
              @if (forgotLoading) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
                TEKSHIRILMOQDA...
              } @else {
                KODNI TASDIQLASH →
              }
            </button>
          }

          <!-- STEP 3: New Password Creation -->
          @if (forgotStep === 3) {
            <p class="modal-desc">Yangi va xavfsiz parol kiring.</p>
            <div class="form-group-new">
              <label class="form-label-new">Yangi parol</label>
              <div class="input-container-new">
                <input
                  [type]="showForgotPwd ? 'text' : 'password'"
                  class="form-control-new"
                  placeholder="Kamida 8 ta belgi"
                  [(ngModel)]="newPassword"
                  (ngModelChange)="checkNewPasswordStrength()">
                <button type="button" class="field-icon eye-toggle" (click)="showForgotPwd = !showForgotPwd">
                  {{ showForgotPwd ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <!-- Password Criteria -->
            <div class="criteria-list">
              <div class="criterion" [class.met]="hasMinLength"><span>{{ hasMinLength ? '✓' : '○' }}</span> Min 8 belgi</div>
              <div class="criterion" [class.met]="hasUpper"><span>{{ hasUpper ? '✓' : '○' }}</span> Katta harf</div>
              <div class="criterion" [class.met]="hasLower"><span>{{ hasLower ? '✓' : '○' }}</span> Kichik harf</div>
              <div class="criterion" [class.met]="hasDigit"><span>{{ hasDigit ? '✓' : '○' }}</span> Raqam</div>
            </div>

            <div class="form-group-new" style="margin-top: 10px;">
              <label class="form-label-new">Parolni tasdiqlash</label>
              <div class="input-container-new">
                <input
                  [type]="showForgotConfirmPwd ? 'text' : 'password'"
                  class="form-control-new"
                  placeholder="Parolni qayta kiriting"
                  [(ngModel)]="confirmNewPassword">
              </div>
            </div>

            <button
              type="button"
              class="btn-signin-gradient"
              [disabled]="forgotLoading || !isNewPasswordValid || newPassword !== confirmNewPassword"
              (click)="saveNewPassword()">
              @if (forgotLoading) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
                SAQLANMOQDA...
              } @else {
                ✅ PAROLNI SAQLASH
              }
            </button>
          }
        </div>
      </div>
    }
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

    .auth-card {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
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

    .demo-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed #334155;
      border-radius: 16px;
      padding: 12px 14px;
      margin-bottom: 24px;
    }
    .demo-label {
      display: block;
      font-size: 0.78rem;
      color: #94a3b8;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .demo-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .demo-chip {
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .demo-chip.client   { background: rgba(249,115,22,0.06); color: #f97316; border-color: rgba(249,115,22,0.15); }
    .demo-chip.courier  { background: rgba(139,92,246,0.06); color: #8b5cf6; border-color: rgba(139,92,246,0.15); }
    .demo-chip.admin    { background: rgba(59,130,246,0.06); color: #3b82f6; border-color: rgba(59,130,246,0.15); }
    .demo-chip.manager  { background: rgba(16,185,129,0.06); color: #10b981; border-color: rgba(16,185,129,0.15); }
    .demo-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
    }

    .form-group-new {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-label-new {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
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
    .otp-input {
      letter-spacing: 6px;
      font-size: 1.2rem;
      font-weight: 700;
      text-align: center;
    }

    .field-icon {
      position: absolute;
      right: 16px;
      font-size: 1.1rem;
      color: #64748b;
      background: none;
      border: none;
      cursor: pointer;
    }
    .success-check { color: #10b981; font-weight: bold; }
    .eye-toggle { color: #94a3b8; }

    .error-msg-new {
      font-size: 0.78rem;
      color: #ef4444;
      margin-top: 4px;
    }

    .options-row-new {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
    }
    .remember-label-new {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #94a3b8;
      cursor: pointer;
      user-select: none;
    }
    .remember-label-new input {
      accent-color: #f97316;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .forgot-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: #f97316;
      text-decoration: none;
      cursor: pointer;
    }
    .forgot-link:hover {
      text-decoration: underline;
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
    .alert-info-new {
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.85rem;
      color: #60a5fa;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .dev-otp-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px dashed #10b981;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 0.88rem;
      color: #34d399;
      margin-bottom: 16px;
      text-align: center;
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
    .footer-text { font-size: 0.85rem; color: #64748b; }
    .signup-link { font-size: 0.88rem; font-weight: 700; color: #f97316; text-decoration: none; }
    .signup-link:hover { text-decoration: underline; }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .forgot-modal {
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.1);
      width: 100%;
      max-width: 480px;
      border-radius: 28px 28px 0 0;
      padding: 28px 24px 36px;
      box-shadow: 0 -20px 60px rgba(0,0,0,0.6);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
    }
    .close-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: #94a3b8;
      font-weight: bold;
      cursor: pointer;
    }
    .modal-desc {
      font-size: 0.88rem;
      color: #94a3b8;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }

    .timer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .timer-text { font-size: 0.82rem; color: #94a3b8; }
    .timer-expired { font-size: 0.82rem; color: #ef4444; font-weight: 600; }
    .btn-resend {
      background: none;
      border: none;
      color: #f97316;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }
    .btn-resend:disabled { color: #64748b; cursor: not-allowed; text-decoration: none; }

    .criteria-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 14px;
      background: rgba(30, 41, 59, 0.5);
      border-radius: 10px;
      padding: 8px 12px;
    }
    .criterion { font-size: 0.75rem; color: #64748b; }
    .criterion.met { color: #34d399; font-weight: 600; }

    .animate-slide-up {
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (min-width: 768px) {
      .auth-page {
        justify-content: center;
        align-items: center;
        background: radial-gradient(circle at top right, #3c2303 0%, #0f172a 100%);
        padding: 40px 20px;
      }
      .auth-card {
        flex: initial;
        max-width: 480px;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .auth-sheet {
        margin-top: -30px;
        border-radius: 24px 24px 0 0;
        padding: 36px 36px;
      }
      .forgot-modal {
        border-radius: 24px;
        margin-bottom: 40px;
      }
    }
  `]
})
export class LoginComponent implements OnDestroy {
  form;
  loading = false;
  errorMsg = '';
  showPwd = false;

  // Forgot Password State
  showForgotModal = false;
  forgotStep = 1;
  forgotRawPhone = '';
  forgotFormattedPhone = '';
  forgotOtpCode = '';
  forgotDevOtp = '';
  newPassword = '';
  confirmNewPassword = '';
  showForgotPwd = false;
  showForgotConfirmPwd = false;
  forgotLoading = false;
  forgotErrorMsg = '';
  forgotInfoMsg = '';

  forgotTimerSeconds = 0;
  forgotTimerInterval: any;

  hasMinLength = false;
  hasUpper = false;
  hasLower = false;
  hasDigit = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      phone: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnDestroy(): void {
    this.stopForgotTimer();
  }

  fillDemo(role: 'client' | 'courier' | 'admin' | 'manager10'): void {
    const map = {
      client:    { phone: '+998901234567', password: 'client123' },
      courier:   { phone: '+998901234568', password: 'courier123' },
      admin:     { phone: '+998901234500', password: 'admin123' },
      manager10: { phone: '+998901230010', password: 'manager123' },
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

    const { phone, password, rememberMe } = this.form.value;
    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData || undefined;

    this.authService.login({ phone: phone!, password: password!, initData, rememberMe: !!rememberMe }).subscribe({
      next: (res) => {
        this.loading = false;
        redirectByRole(this.authService, this.router);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Telefon yoki parol noto\'g\'ri!';
      }
    });
  }

  // ================= PAROLNI TIKLASH (FORGOT PASSWORD) LOGIKASI =================
  openForgotModal(): void {
    this.showForgotModal = true;
    this.forgotStep = 1;
    this.forgotErrorMsg = '';
    this.forgotInfoMsg = '';
    this.forgotOtpCode = '';
    this.newPassword = '';
    this.confirmNewPassword = '';

    // Autofill phone if already entered in login form
    const currentPhone = this.form.get('phone')?.value;
    if (currentPhone) {
      this.onForgotPhoneInput({ target: { value: currentPhone } });
    }
  }

  closeForgotModal(): void {
    this.showForgotModal = false;
    this.stopForgotTimer();
  }

  onForgotPhoneInput(event: any): void {
    let input = event.target.value;
    let digits = input.replace(/\D/g, '');

    if (digits.startsWith('998')) digits = digits.substring(3);
    if (digits.length > 9) digits = digits.substring(0, 9);

    this.forgotRawPhone = '+998' + digits;

    let formatted = '+998';
    if (digits.length > 0) formatted += ' ' + digits.substring(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.substring(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.substring(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.substring(7, 9);

    this.forgotFormattedPhone = formatted;
  }

  get isForgotPhoneValid(): boolean {
    return this.forgotRawPhone.replace(/\D/g, '').length === 12;
  }

  get telegramId(): number | undefined {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id || undefined;
  }

  sendForgotOtp(): void {
    if (!this.isForgotPhoneValid) return;

    this.forgotLoading = true;
    this.forgotErrorMsg = '';
    this.forgotInfoMsg = '';

    this.authService.sendOtp(this.forgotRawPhone, 'RESET_PASSWORD', this.telegramId).subscribe({
      next: (res) => {
        this.forgotLoading = false;
        this.forgotDevOtp = res.devOtpCode || '';
        this.forgotInfoMsg = res.message || 'Tasdiqlash kodi Telegram botimizga yuborildi!';
        this.forgotStep = 2;
        this.startForgotTimer(120);
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotErrorMsg = err.error?.message || 'Ushbu telefon raqamli foydalanuvchi topilmadi!';
      }
    });
  }

  startForgotTimer(seconds: number): void {
    this.stopForgotTimer();
    this.forgotTimerSeconds = seconds;
    this.forgotTimerInterval = setInterval(() => {
      this.forgotTimerSeconds--;
      if (this.forgotTimerSeconds <= 0) {
        this.stopForgotTimer();
      }
    }, 1000);
  }

  stopForgotTimer(): void {
    if (this.forgotTimerInterval) {
      clearInterval(this.forgotTimerInterval);
      this.forgotTimerInterval = null;
    }
  }

  get formattedForgotTimer(): string {
    const m = Math.floor(this.forgotTimerSeconds / 60);
    const s = this.forgotTimerSeconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  onForgotOtpChange(val: string): void {
    this.forgotOtpCode = val.replace(/\D/g, '');
    if (this.forgotOtpCode.length === 6) {
      this.verifyForgotOtp();
    }
  }

  verifyForgotOtp(): void {
    if (this.forgotOtpCode.length < 6) return;

    this.forgotLoading = true;
    this.forgotErrorMsg = '';
    this.forgotInfoMsg = '';

    this.authService.verifyOtp(this.forgotRawPhone, this.forgotOtpCode, 'RESET_PASSWORD').subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotInfoMsg = 'SMS kod tasdiqlandi!';
        this.forgotStep = 3;
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotErrorMsg = err.error?.message || 'Tasdiqlash kodi noto\'g\'ri!';
      }
    });
  }

  checkNewPasswordStrength(): void {
    const p = this.newPassword;
    this.hasMinLength = p.length >= 8;
    this.hasUpper = /[A-Z]/.test(p);
    this.hasLower = /[a-z]/.test(p);
    this.hasDigit = /[0-9]/.test(p);
  }

  get isNewPasswordValid(): boolean {
    return this.hasMinLength && this.hasUpper && this.hasLower && this.hasDigit;
  }

  saveNewPassword(): void {
    if (!this.isNewPasswordValid || this.newPassword !== this.confirmNewPassword) {
      this.forgotErrorMsg = 'Parollar mos emas yoki talablarga javob bermaydi!';
      return;
    }

    this.forgotLoading = true;
    this.forgotErrorMsg = '';

    this.authService.resetPasswordOtp(this.forgotRawPhone, this.forgotOtpCode, this.newPassword).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.snack.open('Parolingiz muvaffaqiyatli o\'zgartirildi!', 'OK', { duration: 4000 });
        this.form.patchValue({ phone: this.forgotRawPhone, password: this.newPassword });
        this.closeForgotModal();
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotErrorMsg = err.error?.message || 'Parolni tiklashda xatolik yuz berdi!';
      }
    });
  }
}
