import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface MenuItem {
  icon: string;
  label: string;
  colorClass: string;
  action: () => void;
}

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
        @for (item of menuItems; track item.label) {
          <div class="menu-item" (click)="item.action()">
            <div class="menu-item-left">
              <div class="menu-icon-wrapper" [ngClass]="item.colorClass">
                @if (item.icon === 'logout') {
                  <span class="material-icons" style="font-size: 20px; color: #f87171;">logout</span>
                } @else {
                  <span class="menu-icon">{{ item.icon }}</span>
                }
              </div>
              <span class="menu-text">{{ item.label }}</span>
            </div>
            <span class="chevron">&rsaquo;</span>
          </div>
        }
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    :host {
      display: block;
      background: #0f0f1a;
    }

    .profile-page {
      max-width: 600px;
      margin: 0 auto;
      padding: 0 0 100px;
      box-sizing: border-box;
      background: #0f0f1a;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ── Header ─────────────────────────────────── */
    .profile-header {
      position: relative;
      padding: 48px 24px 36px;
      background: linear-gradient(135deg, #1a1a3e 0%, #12122a 60%, #0f0f1a 100%);
      overflow: hidden;
    }
    .profile-header::before {
      content: '';
      position: absolute;
      top: -60px; left: -60px;
      width: 220px; height: 220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%);
      pointer-events: none;
    }
    .profile-header::after {
      content: '';
      position: absolute;
      bottom: -40px; right: -40px;
      width: 160px; height: 160px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%);
      pointer-events: none;
    }
    .user-name {
      font-size: 2.4rem;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 6px;
      letter-spacing: -0.03em;
      position: relative;
      z-index: 1;
    }
    .user-phone {
      font-size: 1rem;
      color: rgba(167,139,250,0.85);
      margin: 0;
      font-weight: 500;
      position: relative;
      z-index: 1;
      letter-spacing: 0.02em;
    }

    /* ── Menu List ───────────────────────────────── */
    .profile-menu-list {
      display: flex;
      flex-direction: column;
      padding: 16px 16px 0;
      gap: 8px;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-radius: 16px;
      cursor: pointer;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .menu-item:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.14);
      transform: translateX(4px);
    }
    .menu-item:active {
      transform: scale(0.98);
      background: rgba(255,255,255,0.06);
    }

    .menu-item-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* ── Icon Wrappers ───────────────────────────── */
    .menu-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
    .menu-item:hover .menu-icon-wrapper {
      transform: scale(1.08) rotate(-4deg);
    }

    .menu-icon-wrapper.purple {
      background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2));
      box-shadow: 0 4px 12px rgba(99,102,241,0.25);
    }
    .menu-icon-wrapper.blue {
      background: linear-gradient(135deg, rgba(59,130,246,0.3), rgba(96,165,250,0.2));
      box-shadow: 0 4px 12px rgba(59,130,246,0.25);
    }
    .menu-icon-wrapper.pink {
      background: linear-gradient(135deg, rgba(236,72,153,0.3), rgba(244,114,182,0.2));
      box-shadow: 0 4px 12px rgba(236,72,153,0.25);
    }
    .menu-icon-wrapper.red {
      background: linear-gradient(135deg, rgba(239,68,68,0.3), rgba(252,165,165,0.15));
      box-shadow: 0 4px 12px rgba(239,68,68,0.25);
    }
    .menu-icon-wrapper.violet {
      background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(167,139,250,0.2));
      box-shadow: 0 4px 12px rgba(139,92,246,0.25);
    }
    .menu-icon-wrapper.indigo {
      background: linear-gradient(135deg, rgba(79,70,229,0.3), rgba(129,140,248,0.2));
      box-shadow: 0 4px 12px rgba(79,70,229,0.25);
    }

    .menu-icon {
      font-size: 1.2rem;
    }
    .menu-text {
      font-size: 1rem;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
      letter-spacing: 0.01em;
    }
    .chevron {
      font-size: 1.5rem;
      color: rgba(255,255,255,0.25);
      font-weight: 300;
      line-height: 1;
      transition: color 0.2s, transform 0.2s;
    }
    .menu-item:hover .chevron {
      color: rgba(167,139,250,0.7);
      transform: translateX(2px);
    }

    /* ── Modal ───────────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .info-modal {
      background: linear-gradient(160deg, #1c1c3a 0%, #16162e 100%);
      border: 1px solid rgba(255,255,255,0.10);
      width: 100%;
      max-width: 500px;
      border-top-left-radius: 28px;
      border-top-right-radius: 28px;
      padding: 28px 24px 36px;
      box-sizing: border-box;
      box-shadow: 0 -20px 60px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.08);
      text-align: left;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
    }
    .close-btn {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.10);
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 700;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .close-btn:hover {
      background: rgba(239,68,68,0.2);
      color: #f87171;
      border-color: rgba(239,68,68,0.3);
    }
    .modal-body {
      margin-bottom: 24px;
    }
    .modal-body p {
      margin: 0;
      font-size: 0.97rem;
      color: rgba(255,255,255,0.55);
      line-height: 1.65;
      font-weight: 400;
    }
    .modal-footer {
      display: flex;
    }
    .ok-btn {
      flex: 1;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border: none;
      padding: 15px;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.01em;
      box-shadow: 0 8px 24px rgba(99,102,241,0.4);
      transition: all 0.2s ease;
    }
    .ok-btn:hover {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      transform: translateY(-1px);
      box-shadow: 0 12px 30px rgba(99,102,241,0.5);
    }
    .ok-btn:active {
      transform: translateY(0);
    }

    /* ── Animations ──────────────────────────────── */
    .animate-fade {
      animation: fadeIn 0.35s ease;
    }
    .animate-slide-up {
      animation: slideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `],
})
export class ClientProfileComponent implements OnInit {
  activeModalTitle = signal<string | null>(null);
  activeModalContent = signal<string | null>(null);

  menuItems: MenuItem[] = [];

  constructor(
    public auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.menuItems = [
      {
        icon: '💬',
        label: 'Qo\'llab-quvvatlash',
        colorClass: 'purple',
        action: () => this.auth.showSupportChat.set(!this.auth.showSupportChat())
      },
      {
        icon: '🅰️',
        label: 'Til',
        colorClass: 'blue',
        action: () => this.showInfo(
          'Til',
          "Hozirda faqat O'zbek tili faol. Boshqa tillar tez kunda qo'shiladi."
        )
      },
      {
        icon: '🎫',
        label: 'Promokodlar',
        colorClass: 'pink',
        action: () => this.showInfo(
          'Promokodlar',
          'Sizda hozircha faol promokodlar mavjud emas.'
        )
      },
      {
        icon: '👤',
        label: 'Maxfiylik siyosati',
        colorClass: 'violet',
        action: () => this.showInfo(
          'Maxfiylik siyosati',
          "Maxfiylik siyosati: Shaxsiy ma'lumotlaringiz xavfsizligi Mango Food tomonidan kafolatlanadi."
        )
      },
      {
        icon: '📋',
        label: 'Foydalanuvchi shartnomasi',
        colorClass: 'indigo',
        action: () => this.showInfo(
          'Foydalanuvchi shartnomasi',
          'Foydalanuvchi shartnomasi: Mango Food xizmatlaridan foydalangan holda, siz shartlarimizga rozilik bildirasiz.'
        )
      },
      {
        icon: 'logout',
        label: 'Chiqish',
        colorClass: 'red',
        action: () => this.logout()
      }
    ];
  }

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
    this.snack.open('Tizimdan chiqildi!', '', { duration: 3000 });
  }
}

