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
        <div class="header-user-row">
          <div>
            <h1 class="user-name">{{ auth.user()?.name || 'Mijoz' }}</h1>
            <p class="user-phone">📱 {{ auth.user()?.phone || '+998 00-000-00-00' }}</p>
            @if (auth.user()?.email) {
              <p class="user-email">✉️ {{ auth.user()?.email }}</p>
            } @else {
              <p class="user-email-placeholder">✉️ Email kiritilmagan (tahrirlab qo'shing)</p>
            }
          </div>
          <button type="button" class="btn-edit-header" (click)="openEditProfile()">
            ✏️ Tahrirlash
          </button>
        </div>
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

      <!-- Edit Profile Modal -->
      @if (showEditModal()) {
        <div class="modal-backdrop" (click)="closeEditProfile()">
          <div class="edit-modal animate-slide-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>✏️ Profilni tahrirlash</h3>
              <button class="close-btn" (click)="closeEditProfile()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group-edit">
                <label>To'liq ism</label>
                <input type="text" [(ngModel)]="editName" placeholder="Ismingiz">
              </div>

              <div class="form-group-edit">
                <label>Email <span class="badge-opt">(ixtiyoriy)</span></label>
                <input type="email" [(ngModel)]="editEmail" placeholder="email@manzil.uz">
              </div>

              <div class="form-group-edit">
                <label>Telefon raqam</label>
                <input type="tel" [(ngModel)]="editPhone" placeholder="+998901234567">
              </div>

              <div class="form-group-edit">
                <label>Manzil</label>
                <input type="text" [(ngModel)]="editAddress" placeholder="Toshkent sh, Amir Temur k.">
              </div>

              @if (editError) {
                <div class="alert-error">⚠️ {{ editError }}</div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="cancel-btn" (click)="closeEditProfile()">Bekor qilish</button>
              <button type="button" class="save-btn" [disabled]="saving" (click)="saveProfile()">
                {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
              </button>
            </div>
          </div>
        </div>
      }

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
      padding: 36px 24px 30px;
      background: linear-gradient(135deg, #1a1a3e 0%, #12122a 60%, #0f0f1a 100%);
      overflow: hidden;
    }
    .header-user-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }
    .btn-edit-header {
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.4);
      color: #f97316;
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-edit-header:hover {
      background: #f97316;
      color: #fff;
    }
    .user-name {
      font-size: 2.2rem;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 6px;
      letter-spacing: -0.03em;
    }
    .user-phone {
      font-size: 0.95rem;
      color: rgba(167,139,250,0.9);
      margin: 0 0 4px;
      font-weight: 500;
    }
    .user-email {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
      margin: 0;
    }
    .user-email-placeholder {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.4);
      margin: 0;
      font-style: italic;
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
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .menu-item:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.14);
      transform: translateX(4px);
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
    }

    .menu-icon-wrapper.orange {
      background: linear-gradient(135deg, rgba(249,115,22,0.3), rgba(251,146,60,0.2));
      box-shadow: 0 4px 12px rgba(249,115,22,0.25);
    }
    .menu-icon-wrapper.purple {
      background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2));
    }
    .menu-icon-wrapper.blue {
      background: linear-gradient(135deg, rgba(59,130,246,0.3), rgba(96,165,250,0.2));
    }
    .menu-icon-wrapper.pink {
      background: linear-gradient(135deg, rgba(236,72,153,0.3), rgba(244,114,182,0.2));
    }
    .menu-icon-wrapper.red {
      background: linear-gradient(135deg, rgba(239,68,68,0.3), rgba(252,165,165,0.15));
    }
    .menu-icon-wrapper.violet {
      background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(167,139,250,0.2));
    }
    .menu-icon-wrapper.indigo {
      background: linear-gradient(135deg, rgba(79,70,229,0.3), rgba(129,140,248,0.2));
    }

    .menu-icon { font-size: 1.2rem; }
    .menu-text { font-size: 1rem; font-weight: 600; color: rgba(255,255,255,0.9); }
    .chevron { font-size: 1.5rem; color: rgba(255,255,255,0.25); }

    /* ── Edit Modal ───────────────────────────────────── */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(6px);
      z-index: 999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .edit-modal, .info-modal {
      background: linear-gradient(160deg, #1c1c3a 0%, #16162e 100%);
      border: 1px solid rgba(255,255,255,0.10);
      width: 100%;
      max-width: 500px;
      border-top-left-radius: 28px;
      border-top-right-radius: 28px;
      padding: 28px 24px 36px;
      box-sizing: border-box;
      box-shadow: 0 -20px 60px rgba(0,0,0,0.6);
      text-align: left;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
      color: #ffffff;
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
    }

    .form-group-edit {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group-edit label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .badge-opt {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 400;
    }
    .form-group-edit input {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 12px 14px;
      color: #f1f5f9;
      font-size: 0.95rem;
      outline: none;
    }
    .form-group-edit input:focus {
      border-color: #f97316;
    }

    .alert-error {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.3);
      color: #ef4444;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      margin-top: 8px;
    }

    .modal-footer {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .cancel-btn {
      flex: 1;
      background: rgba(255,255,255,0.08);
      color: #cbd5e1;
      border: none;
      padding: 14px;
      border-radius: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .save-btn, .ok-btn {
      flex: 1;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff;
      border: none;
      padding: 14px;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(249,115,22,0.4);
    }
    .save-btn:disabled {
      background: #475569;
      box-shadow: none;
      cursor: not-allowed;
    }

    .animate-fade { animation: fadeIn 0.35s ease; }
    .animate-slide-up { animation: slideUp 0.38s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class ClientProfileComponent implements OnInit {
  activeModalTitle = signal<string | null>(null);
  activeModalContent = signal<string | null>(null);
  showEditModal = signal<boolean>(false);

  editName = '';
  editEmail = '';
  editPhone = '';
  editAddress = '';
  editError = '';
  saving = false;

  menuItems: MenuItem[] = [];

  constructor(
    public auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.menuItems = [
      {
        icon: '✏️',
        label: 'Profilni tahrirlash',
        colorClass: 'orange',
        action: () => this.openEditProfile()
      },
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

  openEditProfile(): void {
    const user = this.auth.user();
    this.editName = user?.name || '';
    this.editEmail = user?.email || '';
    this.editPhone = user?.phone || '';
    this.editAddress = user?.address || '';
    this.editError = '';
    this.showEditModal.set(true);
  }

  closeEditProfile(): void {
    this.showEditModal.set(false);
  }

  saveProfile(): void {
    if (!this.editName.trim()) {
      this.editError = 'Ismingizni kiritishingiz kerak!';
      return;
    }

    this.saving = true;
    this.editError = '';

    this.auth.updateProfile(this.editName, this.editPhone, this.editAddress, this.editEmail.trim() || undefined).subscribe({
      next: () => {
        this.saving = false;
        this.showEditModal.set(false);
        this.snack.open('Profil muvaffaqiyatli yangilandi!', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.saving = false;
        this.editError = err.error?.message || 'Profilni yangilashda xatolik yuz berdi!';
      }
    });
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
