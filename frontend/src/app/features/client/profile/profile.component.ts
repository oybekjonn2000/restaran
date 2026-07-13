import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page animate-fade">
      <!-- User Info Header -->
      <div class="profile-header">
        <h1 class="user-name">{{ auth.user()?.name || 'Mijoz' }}</h1>
        <p class="user-phone">{{ auth.user()?.phone || '+998 00-000-00-00' }}</p>
      </div>

      <!-- Menu List -->
      <div class="profile-menu-list">
        <!-- Yordam -->
        <div class="menu-item" (click)="showInfo('Yordam', 'Qo\'llab-quvvatlash xizmati bilan bog\'lanish uchun: +998 90 123-45-67')">
          <div class="menu-item-left">
            <div class="menu-icon-wrapper purple">
              <span class="menu-icon">💬</span>
            </div>
            <span class="menu-text">Yordam</span>
          </div>
          <span class="chevron">&rsaquo;</span>
        </div>

        <!-- Til -->
        <div class="menu-item" (click)="showInfo('Til', 'Hozirda faqat O\'zbek tili faol. Boshqa tillar tez kunda qo\'shiladi.')">
          <div class="menu-item-left">
            <div class="menu-icon-wrapper blue">
              <span class="menu-icon">🅰️</span>
            </div>
            <span class="menu-text">Til</span>
          </div>
          <span class="chevron">&rsaquo;</span>
        </div>

        <!-- Promokodlar -->
        <div class="menu-item" (click)="showInfo('Promokodlar', 'Sizda hozircha faol promokodlar mavjud emas.')">
          <div class="menu-item-left">
            <div class="menu-icon-wrapper pink">
              <span class="menu-icon">🎫</span>
            </div>
            <span class="menu-text">Promokodlar</span>
          </div>
          <span class="chevron">&rsaquo;</span>
        </div>

        <!-- Chiqish -->
        <div class="menu-item" (click)="logout()">
          <div class="menu-item-left">
            <div class="menu-icon-wrapper red">
              <span class="menu-icon">🚪</span>
            </div>
            <span class="menu-text">Chiqish</span>
          </div>
          <span class="chevron">&rsaquo;</span>
        </div>

        <!-- Maxfiylik siyosati -->
        <div class="menu-item" (click)="showInfo('Maxfiylik siyosati', 'Maxfiylik siyosati: Shaxsiy ma\'lumotlaringiz xavfsizligi FoodDelivery tomonidan kafolatlanadi.')">
          <div class="menu-item-left">
            <div class="menu-icon-wrapper violet">
              <span class="menu-icon">👤</span>
            </div>
            <span class="menu-text">Maxfiylik siyosati</span>
          </div>
          <span class="chevron">&rsaquo;</span>
        </div>

        <!-- Foydalanuvchi shartnomasi -->
        <div class="menu-item" (click)="showInfo('Foydalanuvchi shartnomasi', 'Foydalanuvchi shartnomasi: FoodDelivery xizmatlaridan foydalangan holda, siz shartlarimizga rozilik bildirasiz.')">
          <div class="menu-item-left">
            <div class="menu-icon-wrapper indigo">
              <span class="menu-icon">📋</span>
            </div>
            <span class="menu-text">Foydalanuvchi shartnomasi</span>
          </div>
          <span class="chevron">&rsaquo;</span>
        </div>
      </div>

      <!-- Info Modal Dialog -->
      @if (activeModalTitle()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="info-modal animate-slide-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ activeModalTitle() }}</h3>
              <button class="close-btn" (click)="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <p>{{ activeModalContent() }}</p>
            </div>
            <div class="modal-footer">
              <button class="ok-btn" (click)="closeModal()">Tushunarli</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px 16px 100px;
      box-sizing: border-box;
      background: #ffffff;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* Header */
    .profile-header {
      text-align: left;
      margin-bottom: 24px;
      padding-bottom: 12px;
    }
    .user-name {
      font-size: 2.2rem;
      font-weight: 800;
      color: #1f2937;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .user-phone {
      font-size: 1.05rem;
      color: #6b7280;
      margin: 0;
      font-weight: 500;
    }

    /* Menu List */
    .profile-menu-list {
      display: flex;
      flex-direction: column;
    }
    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 4px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .menu-item:active {
      background-color: #f9fafb;
    }
    .menu-item-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* Icons and Wrappers (Light Purple Backgrounds) */
    .menu-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .menu-icon-wrapper.purple  { background: rgba(99, 102, 241, 0.08); }
    .menu-icon-wrapper.blue    { background: rgba(59, 130, 246, 0.08); }
    .menu-icon-wrapper.pink    { background: rgba(236, 72, 153, 0.08); }
    .menu-icon-wrapper.red     { background: rgba(239, 68, 68, 0.08); }
    .menu-icon-wrapper.violet  { background: rgba(139, 92, 246, 0.08); }
    .menu-icon-wrapper.indigo  { background: rgba(79, 70, 229, 0.08); }

    .menu-icon {
      font-size: 1.15rem;
    }
    .menu-text {
      font-size: 1.05rem;
      font-weight: 600;
      color: #374151;
    }
    .chevron {
      font-size: 1.6rem;
      color: #9ca3af;
      font-weight: 300;
      line-height: 1;
    }

    /* Info Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .info-modal {
      background: #ffffff;
      width: 100%;
      max-width: 500px;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      padding: 24px;
      box-sizing: border-box;
      box-shadow: 0 -10px 25px rgba(0,0,0,0.15);
      text-align: left;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }
    .close-btn {
      background: #f3f4f6;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 700;
      color: #4b5563;
      cursor: pointer;
    }
    .modal-body {
      margin-bottom: 24px;
    }
    .modal-body p {
      margin: 0;
      font-size: 0.98rem;
      color: #4b5563;
      line-height: 1.5;
    }
    .modal-footer {
      display: flex;
    }
    .ok-btn {
      flex: 1;
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .ok-btn:hover {
      background: #4338ca;
    }

    .animate-fade {
      animation: fadeIn 0.3s ease;
    }
    .animate-slide-up {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `],
})
export class ClientProfileComponent implements OnInit {
  activeModalTitle = signal<string | null>(null);
  activeModalContent = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {}

  showInfo(title: string, content: string): void {
    this.activeModalTitle.set(title);
    this.activeModalContent.set(content);
  }

  closeModal(): void {
    this.activeModalTitle.set(null);
    this.activeModalContent.set(null);
  }

  logout(): void {
    this.auth.logout();
    this.snack.open('🚪 Tizimdan chiqildi!', '', { duration: 3000 });
  }
}
