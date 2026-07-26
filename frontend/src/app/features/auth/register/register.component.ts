import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { redirectByRole } from '../../../core/guards/auth.guard';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Top Header Area with Gradient -->
        <div class="auth-header">
          <div class="header-top-row">
            <button type="button" class="back-btn-icon" (click)="prevStep()" [title]="currentStep > 1 ? 'Oldingi bosqich' : 'Ortga'">
              ←
            </button>
            <span class="step-indicator-badge">Bosqich {{ currentStep }} / 5</span>
          </div>
          <h1 class="header-title">Mango Food<br>Ro'yxatdan o'tish</h1>

          <!-- Stepper Navigation Bar -->
          <div class="stepper-bar">
            <div class="step-item" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
              <div class="step-circle">1</div>
              <span class="step-label">Telefon</span>
            </div>
            <div class="step-line" [class.filled]="currentStep > 1"></div>

            <div class="step-item" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
              <div class="step-circle">2</div>
              <span class="step-label">SMS</span>
            </div>
            <div class="step-line" [class.filled]="currentStep > 2"></div>

            <div class="step-item" [class.active]="currentStep === 3" [class.completed]="currentStep > 3">
              <div class="step-circle">3</div>
              <span class="step-label">Parol</span>
            </div>
            <div class="step-line" [class.filled]="currentStep > 3"></div>

            <div class="step-item" [class.active]="currentStep === 4" [class.completed]="currentStep > 4">
              <div class="step-circle">4</div>
              <span class="step-label">Ism</span>
            </div>
            <div class="step-line" [class.filled]="currentStep > 4"></div>

            <div class="step-item" [class.active]="currentStep === 5" [class.completed]="currentStep === 5 && isCompleted">
              <div class="step-circle">5</div>
              <span class="step-label">Manzil</span>
            </div>
          </div>
        </div>

        <!-- Main Content Sheet -->
        <div class="auth-sheet animate-slide-up">
          @if (errorMsg) {
            <div class="alert-error-new">⚠️ {{ errorMsg }}</div>
          }
          @if (infoMsg) {
            <div class="alert-info-new">ℹ️ {{ infoMsg }}</div>
          }

          <!-- ==================== 1-BOSQICH: TELEFON ==================== -->
          @if (currentStep === 1) {
            <div class="step-content">
              <h2 class="step-title">📱 Telefon raqamingizni kiriting</h2>
              <p class="step-desc">Ro'yxatdan o'tish va tasdiqlash kodini olish uchun telefon raqamingizni kiriting.</p>

              <div class="form-group-new">
                <label class="form-label-new">Telefon raqam</label>
                <div class="input-container-new">
                  <input
                    type="tel"
                    class="form-control-new"
                    placeholder="+998 90 123 45 67"
                    [value]="formattedPhone"
                    (input)="onPhoneInput($event)"
                    id="reg-phone">
                  @if (isPhoneValid) {
                    <span class="field-icon success-check">✓</span>
                  }
                </div>
                @if (phoneError) {
                  <span class="error-msg-new">{{ phoneError }}</span>
                }
              </div>

              <button
                type="button"
                class="btn-signin-gradient"
                [disabled]="loading || !isPhoneValid"
                (click)="sendOtp()">
                @if (loading) {
                  <mat-spinner diameter="20" color="accent"></mat-spinner>
                  YUBORILMOQDA...
                } @else {
                  TASDIQLASH KODINI YUBORISH →
                }
              </button>
            </div>
          }

          <!-- ==================== 2-BOSQICH: OTP SMS TASDIQLASH ==================== -->
          @if (currentStep === 2) {
            <div class="step-content">
              <h2 class="step-title">🔐 Tasdiqlash kodi</h2>
              <p class="step-desc">
                <strong>{{ rawPhone }}</strong> raqamiga 6 xonali tasdiqlash kodi yuborildi.
              </p>

              @if (devOtpCode) {
                <div class="dev-otp-banner">
                  ⚡ Test kodi: <strong>{{ devOtpCode }}</strong>
                </div>
              }

              <div class="form-group-new">
                <label class="form-label-new">6 xonali SMS kod</label>
                <div class="input-container-new">
                  <input
                    type="text"
                    maxlength="6"
                    class="form-control-new otp-input"
                    placeholder="123456"
                    [(ngModel)]="otpCode"
                    (ngModelChange)="onOtpCodeChange($event)"
                    id="reg-otp">
                  @if (otpCode.length === 6) {
                    <span class="field-icon success-check">✓</span>
                  }
                </div>
              </div>

              <!-- Countdown Timer & Resend -->
              <div class="timer-row">
                @if (timerSeconds > 0) {
                  <span class="timer-text">⏳ Kod amal qilish muddati: <strong>{{ formattedTimer }}</strong></span>
                } @else {
                  <span class="timer-expired">⚠️ Kod muddati tugadi</span>
                }
                
                <button
                  type="button"
                  class="btn-resend"
                  [disabled]="loading || timerSeconds > 0"
                  (click)="resendOtp()">
                  🔄 Qaytadan kod yuborish
                </button>
              </div>

              <button
                type="button"
                class="btn-signin-gradient"
                [disabled]="loading || otpCode.length < 6"
                (click)="verifyOtp()">
                @if (loading) {
                  <mat-spinner diameter="20" color="accent"></mat-spinner>
                  TEKSHIRILMOQDA...
                } @else {
                  KODNI TASDIQLASH →
                }
              </button>
            </div>
          }

          <!-- ==================== 3-BOSQICH: PAROL YARATISH ==================== -->
          @if (currentStep === 3) {
            <div class="step-content">
              <h2 class="step-title">🔑 Parol yaratish</h2>
              <p class="step-desc">Hisobingiz uchun kamida 8 ta belgidan iborat kuchli parol o'ylab toping.</p>

              <!-- Password field -->
              <div class="form-group-new">
                <label class="form-label-new">Yangi parol</label>
                <div class="input-container-new">
                  <input
                    [type]="showPwd ? 'text' : 'password'"
                    class="form-control-new"
                    placeholder="Kamida 8 ta belgi"
                    [(ngModel)]="password"
                    (ngModelChange)="checkPasswordStrength()"
                    id="reg-pwd">
                  <button type="button" class="field-icon eye-toggle" (click)="showPwd = !showPwd">
                    {{ showPwd ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <!-- Password Strength Bar -->
              @if (password.length > 0) {
                <div class="strength-wrapper">
                  <div class="strength-bar-bg">
                    <div class="strength-bar-fill" [ngClass]="strengthClass" [style.width.%]="strengthPercent"></div>
                  </div>
                  <span class="strength-text" [ngClass]="strengthClass">Parol kuchi: {{ strengthLabel }}</span>
                </div>
              }

              <!-- Password Criteria Checklist -->
              <div class="criteria-list">
                <div class="criterion" [class.met]="hasMinLength">
                  <span>{{ hasMinLength ? '✓' : '○' }}</span> Kamida 8 ta belgi
                </div>
                <div class="criterion" [class.met]="hasUpper">
                  <span>{{ hasUpper ? '✓' : '○' }}</span> Kamida 1 ta katta harf (A-Z)
                </div>
                <div class="criterion" [class.met]="hasLower">
                  <span>{{ hasLower ? '✓' : '○' }}</span> Kamida 1 ta kichik harf (a-z)
                </div>
                <div class="criterion" [class.met]="hasDigit">
                  <span>{{ hasDigit ? '✓' : '○' }}</span> Kamida 1 ta raqam (0-9)
                </div>
              </div>

              <!-- Confirm Password field -->
              <div class="form-group-new" style="margin-top: 16px;">
                <label class="form-label-new">Parolni tasdiqlash</label>
                <div class="input-container-new">
                  <input
                    [type]="showConfirmPwd ? 'text' : 'password'"
                    class="form-control-new"
                    placeholder="Parolni qayta kiriting"
                    [(ngModel)]="confirmPassword"
                    id="reg-confirm-pwd">
                  <button type="button" class="field-icon eye-toggle" (click)="showConfirmPwd = !showConfirmPwd">
                    {{ showConfirmPwd ? '🙈' : '👁️' }}
                  </button>
                </div>
                @if (confirmPassword.length > 0 && password !== confirmPassword) {
                  <span class="error-msg-new">Parollar bir-biriga mos kelmadi!</span>
                }
              </div>

              <button
                type="button"
                class="btn-signin-gradient"
                [disabled]="loading || !isPasswordValid || password !== confirmPassword"
                (click)="submitPassword()">
                KEYINGI BOSQICH →
              </button>
            </div>
          }

          <!-- ==================== 4-BOSQICH: ISM VA FAMILIYA ==================== -->
          @if (currentStep === 4) {
            <div class="step-content">
              <h2 class="step-title">👤 Shaxsiy ma'lumotlar</h2>
              <p class="step-desc">Buyurtmalaringiz va kuryer bilan aloqa uchun ismingizni kiriting.</p>

              <!-- Name field -->
              <div class="form-group-new">
                <label class="form-label-new">Ism <span class="required-badge">*</span></label>
                <div class="input-container-new">
                  <input
                    type="text"
                    class="form-control-new"
                    placeholder="Ali"
                    [(ngModel)]="name"
                    id="reg-firstname">
                  @if (name.trim().length > 0) {
                    <span class="field-icon success-check">✓</span>
                  }
                </div>
              </div>

              <!-- Surname field -->
              <div class="form-group-new">
                <label class="form-label-new">Familiya <span class="optional-badge">(ixtiyoriy)</span></label>
                <div class="input-container-new">
                  <input
                    type="text"
                    class="form-control-new"
                    placeholder="Valiyev"
                    [(ngModel)]="surname"
                    id="reg-surname">
                </div>
              </div>

              <button
                type="button"
                class="btn-signin-gradient"
                [disabled]="loading || name.trim().length === 0"
                (click)="submitName()">
                MANZILNI TANLASH →
              </button>
            </div>
          }

          <!-- ==================== 5-BOSQICH: MANZIL TANLASH (YANDEX MAP) ==================== -->
          @if (currentStep === 5) {
            <div class="step-content">
              <h2 class="step-title">📍 Yandex Xaritadan manzilni belgilang</h2>
              <p class="step-desc">Xaritadan uyingizni tanlang yoki GPS orqali joylashuvni aniqlang.</p>

              <!-- Yandex Map View -->
              <div class="map-wrapper">
                <div id="register-map" class="yandex-map-container"></div>
                <button type="button" class="btn-gps-float" (click)="locateMe()" title="Joylashuvimni aniqlash">
                  🎯 GPS Joylashuvim
                </button>
              </div>

              <!-- Selected Address Display & Extra Details -->
              <div class="form-group-new" style="margin-top: 16px;">
                <label class="form-label-new">Aniqlangan manzil</label>
                <div class="input-container-new">
                  <input
                    type="text"
                    class="form-control-new"
                    placeholder="Xaritadan manzil tanlang..."
                    [(ngModel)]="address"
                    id="reg-address">
                </div>
              </div>

              <div class="address-details-grid">
                <div class="form-group-new">
                  <label class="form-label-new">Uy raqami</label>
                  <input type="text" class="form-control-sub" placeholder="12" [(ngModel)]="house">
                </div>
                <div class="form-group-new">
                  <label class="form-label-new">Kirish</label>
                  <input type="text" class="form-control-sub" placeholder="2" [(ngModel)]="entrance">
                </div>
                <div class="form-group-new">
                  <label class="form-label-new">Qavat</label>
                  <input type="text" class="form-control-sub" placeholder="4" [(ngModel)]="floor">
                </div>
                <div class="form-group-new">
                  <label class="form-label-new">Xonadon</label>
                  <input type="text" class="form-control-sub" placeholder="18" [(ngModel)]="apartment">
                </div>
              </div>

              <button
                type="button"
                class="btn-signin-gradient"
                [disabled]="loading"
                (click)="completeRegistration()">
                @if (loading) {
                  <mat-spinner diameter="20" color="accent"></mat-spinner>
                  HISOB YARATILMOQDA...
                } @else {
                  ✅ RO'YXATDAN O'TISHNI YAKUNLASH
                }
              </button>
            </div>
          }

          <!-- Footer -->
          <div class="footer-row-new">
            <span class="footer-text">Hisobingiz bormi ?</span>
            <a routerLink="/auth/login" class="signup-link">KIRISH</a>
          </div>
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

    .auth-card {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
    }

    .auth-header {
      padding: 30px 24px 50px 24px;
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
      margin-bottom: 16px;
    }
    .back-btn-icon {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s;
    }
    .back-btn-icon:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateX(-2px);
    }
    .step-indicator-badge {
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px 12px;
      border-radius: 12px;
      letter-spacing: 0.5px;
    }
    .header-title {
      font-size: 1.8rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 20px 0;
      letter-spacing: 0.5px;
    }

    /* Stepper Bar */
    .stepper-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
      padding: 0 4px;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      z-index: 2;
    }
    .step-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: #94a3b8;
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    .step-item.active .step-circle {
      background: #f97316;
      border-color: #fff;
      color: #fff;
      box-shadow: 0 0 12px rgba(249, 115, 22, 0.6);
      transform: scale(1.15);
    }
    .step-item.completed .step-circle {
      background: #10b981;
      border-color: #10b981;
      color: #fff;
    }
    .step-label {
      font-size: 0.68rem;
      color: #94a3b8;
      font-weight: 600;
    }
    .step-item.active .step-label,
    .step-item.completed .step-label {
      color: #fff;
    }
    .step-line {
      flex: 1;
      height: 2px;
      background: rgba(255, 255, 255, 0.15);
      margin: 0 4px 14px 4px;
      transition: background 0.3s ease;
    }
    .step-line.filled {
      background: #10b981;
    }

    /* Auth Sheet */
    .auth-sheet {
      flex: 1;
      background: #0f172a;
      border-radius: 32px 32px 0 0;
      margin-top: -24px;
      padding: 30px 24px;
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
      z-index: 10;
      display: flex;
      flex-direction: column;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      animation: fadeIn 0.3s ease;
    }
    .step-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 6px 0;
    }
    .step-desc {
      font-size: 0.88rem;
      color: #94a3b8;
      margin: 0 0 20px 0;
      line-height: 1.4;
    }

    .form-group-new {
      margin-bottom: 18px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label-new {
      font-size: 0.82rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .input-container-new {
      position: relative;
      display: flex;
      align-items: center;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 0 14px;
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
      padding: 13px 0;
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
      right: 14px;
      font-size: 1rem;
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
      margin-top: 2px;
    }

    .alert-error-new {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
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
      font-size: 0.9rem;
      color: #34d399;
      margin-bottom: 16px;
      text-align: center;
    }

    /* Timer Row */
    .timer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
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
    .btn-resend:disabled {
      color: #64748b;
      cursor: not-allowed;
      text-decoration: none;
    }

    /* Strength Bar */
    .strength-wrapper {
      margin-bottom: 16px;
    }
    .strength-bar-bg {
      height: 6px;
      background: #1e293b;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .strength-bar-fill {
      height: 100%;
      transition: width 0.3s ease, background-color 0.3s ease;
    }
    .strength-bar-fill.weak { background-color: #ef4444; }
    .strength-bar-fill.medium { background-color: #f59e0b; }
    .strength-bar-fill.strong { background-color: #10b981; }

    .strength-text { font-size: 0.78rem; font-weight: 600; }
    .strength-text.weak { color: #ef4444; }
    .strength-text.medium { color: #f59e0b; }
    .strength-text.strong { color: #10b981; }

    .criteria-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 12px;
      margin-bottom: 16px;
      background: rgba(30, 41, 59, 0.5);
      border-radius: 12px;
      padding: 10px 12px;
    }
    .criterion {
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .criterion.met {
      color: #34d399;
      font-weight: 600;
    }

    /* Map & Address Details */
    .map-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #334155;
      margin-bottom: 14px;
    }
    .yandex-map-container {
      width: 100%;
      height: 100%;
    }
    .btn-gps-float {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: #0f172a;
      color: #f97316;
      border: 1px solid #f97316;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      z-index: 100;
      transition: all 0.2s;
    }
    .btn-gps-float:hover {
      background: #f97316;
      color: #fff;
    }

    .address-details-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }
    .form-control-sub {
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 10px;
      font-size: 0.85rem;
      color: #f1f5f9;
      outline: none;
      box-sizing: border-box;
    }
    .form-control-sub:focus {
      border-color: #f97316;
    }

    .btn-signin-gradient {
      width: 100%;
      height: 48px;
      border-radius: 24px;
      border: none;
      background: linear-gradient(90deg, #f97316 0%, #0f172a 100%);
      color: #fff;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.35);
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: 'Poppins', sans-serif;
      margin-top: 10px;
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
      padding-top: 24px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
    }
    .footer-text { font-size: 0.82rem; color: #64748b; }
    .signup-link { font-size: 0.85rem; font-weight: 700; color: #f97316; text-decoration: none; }
    .signup-link:hover { text-decoration: underline; }

    .required-badge { color: #ef4444; }
    .optional-badge { font-size: 0.72rem; color: #64748b; font-weight: 400; }

    .animate-slide-up {
      animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
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
        width: 100%;
        max-width: 500px;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .auth-sheet {
        margin-top: -24px;
        border-radius: 24px 24px 0 0;
        padding: 30px 32px;
      }
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  currentStep = 1;
  isCompleted = false;

  // Form State
  rawPhone = '';
  formattedPhone = '';
  phoneError = '';

  otpCode = '';
  devOtpCode = '';
  timerSeconds = 0;
  timerInterval: any;

  password = '';
  confirmPassword = '';
  showPwd = false;
  showConfirmPwd = false;

  hasMinLength = false;
  hasUpper = false;
  hasLower = false;
  hasDigit = false;
  strengthPercent = 0;
  strengthLabel = '';
  strengthClass = '';

  name = '';
  surname = '';

  address = '';
  house = '';
  entrance = '';
  floor = '';
  apartment = '';
  lat = 41.311081;
  lng = 69.240562;

  loading = false;
  errorMsg = '';
  infoMsg = '';

  private ymap: any;
  private placemark: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ================= 1-BOSQICH LOGIKASI =================
  onPhoneInput(event: any): void {
    let input = event.target.value;
    let digits = input.replace(/\D/g, '');

    if (digits.startsWith('998')) {
      digits = digits.substring(3);
    }

    if (digits.length > 9) {
      digits = digits.substring(0, 9);
    }

    this.rawPhone = '+998' + digits;
    
    // Format presentation: +998 XX XXX XX XX
    let formatted = '+998';
    if (digits.length > 0) formatted += ' ' + digits.substring(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.substring(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.substring(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.substring(7, 9);

    this.formattedPhone = formatted;

    if (digits.length === 9) {
      this.phoneError = '';
    } else {
      this.phoneError = 'Telefon raqamini to\'liq kiriting (9 ta raqam)';
    }
  }

  get isPhoneValid(): boolean {
    return this.rawPhone.replace(/\D/g, '').length === 12;
  }

  get telegramId(): number | undefined {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id || undefined;
  }

  private extractError(err: any, fallback: string): string {
    if (!err) return fallback;
    if (typeof err.error === 'string') {
      if (err.error.includes('<html')) return 'Server yoki Tunnel bilan aloqa bog\'lanmadi!';
      return err.error;
    }
    return err.error?.message || err.message || fallback;
  }

  sendOtp(): void {
    if (!this.isPhoneValid) return;

    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';

    this.authService.sendOtp(this.rawPhone, 'REGISTER', this.telegramId).subscribe({
      next: (res) => {
        this.loading = false;
        this.devOtpCode = res.devOtpCode || '';
        this.infoMsg = res.message || 'Tasdiqlash kodi Telegram botimizga yuborildi!';
        this.currentStep = 2;
        this.startTimer(120);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = this.extractError(err, 'Kod yuborishda xatolik yuz berdi!');
      }
    });
  }

  // ================= 2-BOSQICH LOGIKASI =================
  startTimer(seconds: number): void {
    this.stopTimer();
    this.timerSeconds = seconds;
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      if (this.timerSeconds <= 0) {
        this.stopTimer();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTimer(): string {
    const m = Math.floor(this.timerSeconds / 60);
    const s = this.timerSeconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  onOtpCodeChange(val: string): void {
    this.otpCode = val.replace(/\D/g, '');
    if (this.otpCode.length === 6) {
      this.verifyOtp();
    }
  }

  resendOtp(): void {
    if (this.timerSeconds > 0) return;
    this.sendOtp();
  }

  verifyOtp(): void {
    if (this.otpCode.length < 6) return;

    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';

    this.authService.verifyOtp(this.rawPhone, this.otpCode, 'REGISTER').subscribe({
      next: () => {
        this.loading = false;
        this.infoMsg = 'Telefon raqami muvaffaqiyatli tasdiqlandi!';
        this.currentStep = 3;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Tasdiqlash kodi noto\'g\'ri!';
      }
    });
  }

  // ================= 3-BOSQICH LOGIKASI =================
  checkPasswordStrength(): void {
    const p = this.password;
    this.hasMinLength = p.length >= 8;
    this.hasUpper = /[A-Z]/.test(p);
    this.hasLower = /[a-z]/.test(p);
    this.hasDigit = /[0-9]/.test(p);

    let score = 0;
    if (this.hasMinLength) score++;
    if (this.hasUpper) score++;
    if (this.hasLower) score++;
    if (this.hasDigit) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 2) {
      this.strengthPercent = 33;
      this.strengthLabel = 'Zaif';
      this.strengthClass = 'weak';
    } else if (score <= 4) {
      this.strengthPercent = 66;
      this.strengthLabel = "O'rtacha";
      this.strengthClass = 'medium';
    } else {
      this.strengthPercent = 100;
      this.strengthLabel = 'Kuchli';
      this.strengthClass = 'strong';
    }
  }

  get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasUpper && this.hasLower && this.hasDigit;
  }

  submitPassword(): void {
    if (!this.isPasswordValid || this.password !== this.confirmPassword) {
      this.errorMsg = 'Parol talablarga mos emas yoki parollar bir xil emas!';
      return;
    }
    this.errorMsg = '';
    this.currentStep = 4;
  }

  // ================= 4-BOSQICH LOGIKASI =================
  submitName(): void {
    if (!this.name.trim()) {
      this.errorMsg = 'Ismingizni kiriting!';
      return;
    }
    this.errorMsg = '';
    this.currentStep = 5;

    // Yandex Map initialize after DOM renders step 5
    setTimeout(() => {
      this.initYandexMap();
    }, 150);
  }

  // ================= 5-BOSQICH LOGIKASI (YANDEX MAP) =================
  initYandexMap(): void {
    const ymaps = (window as any).ymaps;
    if (!ymaps) {
      this.address = "Toshkent shahri, Amir Temur ko'chasi";
      return;
    }

    ymaps.ready(() => {
      const container = document.getElementById('register-map');
      if (!container) return;

      container.innerHTML = '';
      this.ymap = new ymaps.Map('register-map', {
        center: [this.lat, this.lng],
        zoom: 15,
        controls: ['zoomControl']
      });

      this.placemark = new ymaps.Placemark([this.lat, this.lng], {}, {
        draggable: true
      });

      this.ymap.geoObjects.add(this.placemark);

      // Handle drag end
      this.placemark.events.add('dragend', () => {
        const coords = this.placemark.geometry.getCoordinates();
        this.lat = coords[0];
        this.lng = coords[1];
        this.reverseGeocode(this.lat, this.lng);
      });

      // Handle map click
      this.ymap.events.add('click', (e: any) => {
        const coords = e.get('coords');
        this.lat = coords[0];
        this.lng = coords[1];
        this.placemark.geometry.setCoordinates(coords);
        this.reverseGeocode(this.lat, this.lng);
      });

      // Initial reverse geocode
      this.reverseGeocode(this.lat, this.lng);
    });
  }

  locateMe(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.lat = pos.coords.latitude;
          this.lng = pos.coords.longitude;
          if (this.ymap && this.placemark) {
            this.ymap.setCenter([this.lat, this.lng], 16);
            this.placemark.geometry.setCoordinates([this.lat, this.lng]);
          }
          this.reverseGeocode(this.lat, this.lng);
        },
        () => {
          this.errorMsg = 'GPS joylashuvni aniqlab bo\'lmadi!';
        }
      );
    }
  }

  reverseGeocode(lat: number, lng: number): void {
    const ymaps = (window as any).ymaps;
    if (ymaps && ymaps.geocode) {
      ymaps.geocode([lat, lng]).then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          this.address = firstGeoObject.getAddressLine() || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        }
      }).catch(() => {
        this.fallbackReverseGeocode(lat, lng);
      });
    } else {
      this.fallbackReverseGeocode(lat, lng);
    }
  }

  fallbackReverseGeocode(lat: number, lng: number): void {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uz`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          this.address = data.display_name;
        } else {
          this.address = `Joylashuv: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
      })
      .catch(() => {
        this.address = `Joylashuv: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      });
  }

  // ================= YAKUNIY RO'YXATDAN O'TISH =================
  completeRegistration(): void {
    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';

    this.authService.register({
      phone: this.rawPhone,
      otpCode: this.otpCode,
      password: this.password,
      name: this.name.trim(),
      surname: this.surname.trim() || undefined,
      address: this.address || undefined,
      house: this.house || undefined,
      entrance: this.entrance || undefined,
      floor: this.floor || undefined,
      apartment: this.apartment || undefined,
      role: 'CLIENT'
    }).subscribe({
      next: () => {
        this.loading = false;
        this.isCompleted = true;
        redirectByRole(this.authService, this.router);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi!';
      }
    });
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMsg = '';
    } else {
      this.router.navigate(['/client/restaurants']);
    }
  }
}
