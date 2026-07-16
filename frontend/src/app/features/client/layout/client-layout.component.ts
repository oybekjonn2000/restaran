import { Component, effect } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { FooterComponent } from './footer.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { API_BASE } from '../../../core/config';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, MatSnackBarModule, FooterComponent],
  template: `
    <div class="client-layout">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="nav-brand">
          <span class="logo">🍽️</span>
          <span class="brand-name">Mango<span class="accent">Food</span></span>
        </div>

        <div class="nav-links">
          <a routerLink="/client/restaurants" routerLinkActive="active" class="nav-link" id="nav-menu">
            🏪 Restoranlar
          </a>
          <a routerLink="/client/orders" routerLinkActive="active" class="nav-link" id="nav-orders">
            📋 Buyurtmalarim
          </a>
        </div>

        <div class="nav-actions">
          <a routerLink="/client/cart" class="cart-btn" id="cart-toggle-btn" style="text-decoration: none;">
            🛒
            @if (cart.totalItems() > 0) {
              <span class="cart-badge">{{ cart.totalItems() }}</span>
            }
          </a>

          <!-- User info -->
          @if (auth.isLoggedIn()) {
            <a routerLink="/client/profile" class="user-chip-link" style="text-decoration: none;">
              <div class="user-chip" style="cursor: pointer;">
                <span class="user-avatar">{{ userInitial }}</span>
                <span class="user-name">{{ (auth.user()?.name ?? '') | slice:0:10 }}</span>
              </div>
            </a>
            <button class="logout-btn" (click)="auth.logout()" title="Chiqish" id="logout-btn" style="display: flex; align-items: center; justify-content: center; padding: 8px;">
              <span class="material-icons" style="font-size: 20px; color: #ef4444;">logout</span>
            </button>
          } @else {
            <a routerLink="/auth/login" class="nav-link active" style="padding: 8px 16px; border-radius: 20px; text-decoration: none;" id="nav-login-btn">
              🔑 Kirish
            </a>
          }
        </div>
      </nav>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet />
      </main>

      <!-- Reusable Footer Component -->
      @if (!isFooterHidden) {
        <app-footer />
      }

      <!-- Bottom Nav for Mobile -->
      <div class="bottom-nav">
        <a routerLink="/client/restaurants" routerLinkActive="active" class="bottom-nav-link" id="mob-nav-menu">
          <span class="bottom-nav-icon">🏪</span>
          <span class="bottom-nav-text">Restoranlar</span>
        </a>
        @if (auth.isLoggedIn()) {
          <a routerLink="/client/orders" routerLinkActive="active" class="bottom-nav-link" id="mob-nav-orders">
            <span class="bottom-nav-icon">📋</span>
            <span class="bottom-nav-text">Buyurtmalar</span>
          </a>
        } @else {
          <a routerLink="/auth/login" class="bottom-nav-link" id="mob-nav-login">
            <span class="bottom-nav-icon">🔑</span>
            <span class="bottom-nav-text">Kirish</span>
          </a>
        }
        <a routerLink="/client/cart" routerLinkActive="active" class="bottom-nav-link" id="mob-nav-cart">
          <span class="bottom-nav-icon">
            🛒
            @if (cart.totalItems() > 0) {
              <span class="bottom-nav-badge">{{ cart.totalItems() }}</span>
            }
          </span>
          <span class="bottom-nav-text">Savat</span>
        </a>
        @if (auth.isLoggedIn()) {
          <a routerLink="/client/profile" routerLinkActive="active" class="bottom-nav-link" id="mob-nav-profile">
            <span class="bottom-nav-icon">👤</span>
            <span class="bottom-nav-text">Profil</span>
          </a>
        }
      </div>

      <!-- ===== CUSTOMER SUPPORT CHAT MODAL ===== -->
      @if (auth.showSupportChat()) {
        <div class="support-chat-overlay" (click)="closeSupportChat()">
          <div class="support-chat-window animate-slide-up" (click)="$event.stopPropagation()">
            <div class="chat-window-header">
              <div class="header-user-info">
                <span class="chat-logo">💬</span>
                <div>
                  <div class="chat-title">Mijozlarni Qo'llab-quvvatlash</div>
                  <div class="chat-subtitle">Online ko'mak va yordam</div>
                </div>
              </div>
              <button class="close-chat-btn" (click)="closeSupportChat()">✕</button>
            </div>

            <!-- Chat History -->
            <div class="chat-history-body" id="customer-chat-history">
              @if (isSupportLoading) {
                <div class="chat-loading-overlay">
                  <div class="spinner-css"></div>
                  <p>Xabarlar yuklanmoqda...</p>
                </div>
              } @else {
                @if (supportMessages.length === 0) {
                  <div class="chat-empty-state">
                    <span class="chat-welcome-icon">👋</span>
                    <h3>Sizga qanday yordam bera olamiz?</h3>
                    <p>Savollaringiz yoki shikoyatlaringiz bo'lsa yozing. Biz har doim yordamga tayyormiz!</p>
                  </div>
                } @else {
                  @for (msg of supportMessages; track msg.id) {
                    <div class="chat-msg-row" [class.msg-sent]="msg.senderType !== 'admin'" [class.msg-received]="msg.senderType === 'admin'">
                      <div class="chat-bubble">
                        @if (msg.message) {
                          <div class="msg-text">{{ msg.message }}</div>
                        }
                        @if (msg.attachment) {
                          <div class="msg-attachment">
                            @if (isImage(msg.attachment)) {
                              <img [src]="getAttachmentUrl(msg.attachment)" class="chat-img-attachment" (click)="openAttachment(getAttachmentUrl(msg.attachment))" style="cursor: pointer;" alt="Rasm" />
                            } @else {
                              <a [href]="getAttachmentUrl(msg.attachment)" target="_blank" class="chat-file-attachment">
                                📂 Faylni yuklab olish
                              </a>
                            }
                          </div>
                        }
                        <div class="msg-footer">
                          <span class="msg-time">{{ msg.createdAt | date:'HH:mm' }}</span>
                          @if (msg.senderType !== 'admin') {
                            <span class="msg-seen">
                              @if (msg.seen) {
                                <span class="check-blue">✓✓</span>
                              } @else {
                                <span>✓</span>
                              }
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                }
              }
            </div>

            <!-- Preview uploaded attachment -->
            @if (supportAttachmentName) {
              <div class="attach-preview-bar">
                <span class="file-name">📎 {{ supportAttachmentName }}</span>
                @if (isUploadingAttachment) {
                  <span class="uploading-text">(yuklanmoqda...)</span>
                }
                <button class="clear-attach-btn" (click)="clearSupportAttachment()">✕</button>
              </div>
            }

            <!-- Input Bar -->
            <div class="chat-window-input">
              <label class="attach-file-btn" title="Fayl yoki rasm yuklash">
                📎
                <input type="file" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" (change)="onSupportFileSelected($event)" style="display: none;" />
              </label>
              <input
                type="text"
                class="chat-input-field"
                [(ngModel)]="supportMessageInput"
                (keyup.enter)="sendSupportMsg()"
                placeholder="Xabaringizni yozing..."
                [disabled]="isSupportLoading || isUploadingAttachment" />
              <button
                class="chat-send-btn"
                (click)="sendSupportMsg()"
                [disabled]="(!supportMessageInput.trim() && !supportAttachmentUrl) || isSupportLoading || isUploadingAttachment">
                ➔
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .client-layout { min-height: 100vh; display: flex; flex-direction: column; }

    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }
    .logo { font-size: 1.5rem; }
    .brand-name { font-size: 1.2rem; font-weight: 800; color: var(--text); }
    .accent { color: var(--primary); }

    .nav-links {
      display: flex;
      gap: 4px;
    }

    .nav-link {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: var(--transition);
      text-decoration: none;
    }
    .nav-link:hover, .nav-link.active {
      background: rgba(249,115,22,0.1);
      color: var(--primary);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cart-btn {
      position: relative;
      background: rgba(249,115,22,0.15);
      border: 1px solid rgba(249,115,22,0.3);
      border-radius: 12px;
      padding: 8px 14px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: var(--transition);
      color: var(--primary);
    }
    .cart-btn:hover {
      background: rgba(249,115,22,0.25);
      transform: scale(1.05);
    }

    .cart-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      animation: bounce 0.3s ease;
    }

    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.3); }
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card2);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 6px 12px;
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: white;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text);
    }

    .logout-btn {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 1rem;
      transition: var(--transition);
    }
    .logout-btn:hover { background: rgba(239,68,68,0.2); }

    .main-content {
      flex: 1;
      padding: 24px;
    }

    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 60px;
      background: rgba(30, 41, 59, 0.98);
      backdrop-filter: blur(10px);
      border-top: 1px solid var(--border);
      z-index: 150;
      justify-content: space-around;
      align-items: center;
    }

    .bottom-nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--text-muted);
      font-size: 0.72rem;
      font-weight: 500;
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      padding: 4px 12px;
      transition: var(--transition);
      font-family: 'Poppins', sans-serif;
    }

    .bottom-nav-link.active {
      color: var(--primary);
    }

    .bottom-nav-icon {
      font-size: 1.2rem;
      margin-bottom: 2px;
      position: relative;
      display: inline-block;
    }

    .bottom-nav-badge {
      position: absolute;
      top: -4px;
      right: -10px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      font-weight: 700;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 150;
      backdrop-filter: blur(2px);
    }

    @media (max-width: 640px) {
      .bottom-nav { display: flex; }
      .nav-links { display: none; }
      .cart-btn { display: none; }
      .navbar { padding: 0 16px; }
      .main-content { padding: 16px 16px 80px; }
    }

    /* CUSTOMER SUPPORT CHAT OVERLAY */
    .support-chat-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      z-index: 1000;
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    .support-chat-window {
      width: 100%;
      max-width: 460px;
      height: 600px;
      max-height: 85vh;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      font-family: 'Poppins', sans-serif;
      animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .chat-window-header {
      background: #0f172a;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
    }
    .header-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chat-logo {
      font-size: 1.6rem;
    }
    .chat-title {
      font-size: 0.96rem;
      font-weight: 700;
      color: #fff;
    }
    .chat-subtitle {
      font-size: 0.76rem;
      color: #94a3b8;
    }
    .close-chat-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.3rem;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s;
    }
    .close-chat-btn:hover {
      color: #f1f5f9;
    }
    .chat-history-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .chat-loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
    }
    .spinner-css {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: #f97316;
      animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .chat-msg-row {
      display: flex;
      width: 100%;
    }
    .chat-msg-row.msg-sent {
      justify-content: flex-end;
    }
    .chat-msg-row.msg-received {
      justify-content: flex-start;
    }
    .chat-bubble {
      max-width: 78%;
      padding: 12px 16px;
      border-radius: 18px;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      line-height: 1.45;
    }
    .msg-sent .chat-bubble {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .msg-received .chat-bubble {
      background: #334155;
      color: #cbd5e1;
      border-bottom-left-radius: 4px;
      border: 1px solid #475569;
    }
    .msg-text {
      font-size: 0.9rem;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg-attachment {
      margin-top: 8px;
      border-radius: 10px;
      overflow: hidden;
    }
    .chat-img-attachment {
      max-width: 100%;
      max-height: 180px;
      object-fit: cover;
      display: block;
      border-radius: 8px;
    }
    .chat-file-attachment {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.08);
      color: #60a5fa;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .msg-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 4px;
      margin-top: 6px;
      font-size: 0.65rem;
      opacity: 0.8;
    }
    .msg-sent .msg-time {
      color: rgba(255, 255, 255, 0.85);
    }
    .msg-received .msg-time {
      color: #94a3b8;
    }
    .check-blue {
      color: #38bdf8;
    }
    .chat-window-input {
      display: flex;
      align-items: center;
      padding: 12px 18px;
      background: #0f172a;
      border-top: 1px solid #334155;
      gap: 12px;
    }
    .attach-file-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #334155;
      border: 1px solid #475569;
      color: #cbd5e1;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .attach-file-btn:hover {
      background: #475569;
      color: #fff;
    }
    .chat-input-field {
      flex: 1;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 10px 18px;
      color: #fff;
      font-size: 0.92rem;
      outline: none;
    }
    .chat-input-field:focus {
      border-color: #f97316;
    }
    .chat-send-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #f97316;
      border: none;
      color: #fff;
      font-size: 1.15rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .chat-send-btn:disabled {
      background: #334155;
      color: #64748b;
      cursor: not-allowed;
    }
  `]
})
export class ClientLayoutComponent {

  get userInitial(): string {
    return (this.auth.user()?.name?.[0] ?? 'U').toUpperCase();
  }

  get isFooterHidden(): boolean {
    const url = this.router.url;
    return url.startsWith('/client/cart') || url.startsWith('/client/orders') || url.startsWith('/client/profile');
  }

  activeTicket: any = null;
  supportMessages: any[] = [];
  supportMessageInput = '';
  isSupportLoading = false;
  supportAttachmentUrl: string | null = null;
  supportAttachmentName: string | null = null;
  supportPollingInterval: any = null;

  isUploadingAttachment = false;

  constructor(
    public auth: AuthService,
    public cart: CartService,
    private router: Router,
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {
    // When showSupportChat changes to true, trigger initSupportChat
    effect(() => {
      if (this.auth.showSupportChat()) {
        this.initSupportChat();
      } else {
        this.stopSupportPolling();
      }
    });

    // Close support chat on route navigation
    this.router.events.subscribe(() => {
      this.auth.showSupportChat.set(false);
    });
  }

  initSupportChat(): void {
    this.isSupportLoading = true;
    this.orderService.getOrCreateActiveTicket('customer').subscribe({
      next: (ticket) => {
        this.activeTicket = ticket;
        this.loadSupportMessages(ticket.id);
        this.startSupportPolling(ticket.id);
      },
      error: () => this.isSupportLoading = false
    });
  }

  loadSupportMessages(ticketId: number): void {
    this.orderService.getTicketMessages(ticketId).subscribe({
      next: (msgs) => {
        this.isSupportLoading = false;
        this.supportMessages = msgs;
        this.orderService.markMessagesAsSeen(ticketId).subscribe();
        setTimeout(() => this.scrollToChatBottom(), 100);
      },
      error: () => this.isSupportLoading = false
    });
  }

  startSupportPolling(ticketId: number): void {
    this.stopSupportPolling();
    this.supportPollingInterval = setInterval(() => {
      this.orderService.getTicketMessages(ticketId).subscribe({
        next: (msgs) => {
          if (msgs.length !== this.supportMessages.length || JSON.stringify(msgs) !== JSON.stringify(this.supportMessages)) {
            this.supportMessages = msgs;
            this.orderService.markMessagesAsSeen(ticketId).subscribe();
            setTimeout(() => this.scrollToChatBottom(), 100);
          }
        }
      });
    }, 2500);
  }

  stopSupportPolling(): void {
    if (this.supportPollingInterval) {
      clearInterval(this.supportPollingInterval);
      this.supportPollingInterval = null;
    }
  }

  sendSupportMsg(): void {
    const text = this.supportMessageInput.trim();
    const attach = this.supportAttachmentUrl;
    const ticket = this.activeTicket;
    if (!ticket || (!text && !attach)) return;

    this.orderService.sendSupportMessage(ticket.id, text, attach).subscribe({
      next: (newMsg) => {
        this.supportMessageInput = '';
        this.supportAttachmentUrl = null;
        this.supportAttachmentName = null;
        this.supportMessages.push(newMsg);
        setTimeout(() => this.scrollToChatBottom(), 100);
      }
    });
  }

  onSupportFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt || '')) {
      this.snack.open('❌ Noto\'g\'ri fayl formati! JPG, PNG, WEBP, PDF, DOCX ruxsat etiladi.', '', { duration: 3000 });
      return;
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      this.snack.open('❌ Fayl hajmi 10 MB dan oshmasligi kerak!', '', { duration: 3000 });
      return;
    }

    this.supportAttachmentName = file.name;
    this.supportAttachmentUrl = null;
    this.isUploadingAttachment = true;

    this.orderService.uploadImage(file).subscribe({
      next: (res) => {
        this.supportAttachmentUrl = res.url;
        this.isUploadingAttachment = false;
      },
      error: () => {
        this.snack.open('❌ Fayl yuklashda xatolik yuz berdi', '', { duration: 3000 });
        this.supportAttachmentName = null;
        this.isUploadingAttachment = false;
      }
    });
  }

  clearSupportAttachment(): void {
    this.supportAttachmentUrl = null;
    this.supportAttachmentName = null;
  }

  closeSupportChat(): void {
    this.auth.showSupportChat.set(false);
  }

  openAttachment(url: string): void {
    window.open(url, '_blank');
  }

  isImage(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.jpg') || 
           lower.endsWith('.jpeg') || 
           lower.endsWith('.png') || 
           lower.endsWith('.webp') || 
           lower.endsWith('.gif') || 
           lower.endsWith('.svg') || 
           lower.startsWith('data:image/');
  }

  getAttachmentUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return `${API_BASE}${url}`;
  }

  scrollToChatBottom(): void {
    const container = document.getElementById('customer-chat-history');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
