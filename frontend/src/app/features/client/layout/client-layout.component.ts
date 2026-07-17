import { Component, effect, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { FooterComponent } from './footer.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { API_BASE } from '../../../core/config';

export interface NotificationItem {
  id: string;
  text: string;
  createdAt: number;
  seen: boolean;
  orderId?: number;
  status?: string;
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule, MatSnackBarModule, FooterComponent],
  template: `
    <div class="client-layout">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="nav-brand" routerLink="/client/restaurants">
          <span class="logo">🥭</span>
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
          <!-- Notification Bell (Always Visible) -->
          <div class="bell-container" (click)="showNotifications.set(!showNotifications()); $event.stopPropagation()">
            <button class="bell-btn">
              🔔
              @if (unreadCount() > 0) {
                <span class="bell-badge animate-bounce">{{ unreadCount() }}</span>
              }
            </button>
            @if (showNotifications()) {
              <div class="notifications-dropdown animate-pop" (click)="$event.stopPropagation()">
                <div class="dropdown-header">
                  <span>Bildirishnomalar</span>
                  @if (unreadCount() > 0) {
                    <button class="mark-read-btn" (click)="markAllAsRead()">Hammasini o'qish</button>
                  }
                </div>
                <div class="dropdown-list">
                  @if (notifications().length === 0) {
                    <div class="empty-notifications">Bildirishnomalar yo'q</div>
                  } @else {
                    @for (n of notifications(); track n.id) {
                      <div class="notification-item" [class.unread]="!n.seen" (click)="markAsRead(n)">
                        <div class="noti-text">🔔 {{ n.text }}</div>
                        <div class="noti-time">{{ n.createdAt | date:'HH:mm' }}</div>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <!-- Cart Button -->
          <a routerLink="/client/cart" class="cart-btn-new" id="cart-toggle-btn" style="text-decoration: none;">
            🛒
            @if (cart.totalItems() > 0) {
              <span class="cart-badge-new">{{ cart.totalItems() }}</span>
            }
          </a>

          <!-- User info / Profile Avatar -->
          @if (auth.isLoggedIn()) {
            <div class="profile-container" (click)="showUserMenu.set(!showUserMenu()); $event.stopPropagation()">
              <div class="profile-avatar">
                {{ userInitial }}
              </div>
              @if (showUserMenu()) {
                <div class="profile-dropdown animate-pop">
                  <div class="dropdown-header">Mening Hisobim</div>
                  <a routerLink="/client/profile" class="dropdown-link">👤 Profil Sozlamalari</a>
                  <a routerLink="/client/orders" class="dropdown-link">📋 Buyurtmalarim</a>
                  <button (click)="auth.showSupportChat.set(true)" class="dropdown-link text-left" style="width: 100%">💬 Yordam & Support</button>
                  <button (click)="auth.logout()" class="dropdown-link text-left text-danger" style="width: 100%; border-top: 1px solid #334155;">🚪 Chiqish</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login" class="nav-link-login-gradient" id="nav-login-btn">
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

      <!-- Floating Support Button -->
      @if (auth.isLoggedIn() && !auth.showSupportChat()) {
        <button class="floating-support-btn animate-pop" (click)="auth.showSupportChat.set(true)" title="Qo'llab-quvvatlash">
          💬
        </button>
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
    .client-layout { min-height: 100vh; display: flex; flex-direction: column; background: #0f172a; color: #f1f5f9; }

    /* STICKY GLASSMORPHIC NAVBAR */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #334155;
      padding: 0 24px;
      height: 72px;
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
      cursor: pointer;
    }
    .logo { font-size: 1.8rem; }
    .brand-name { font-size: 1.25rem; font-weight: 800; color: #fff; }
    .accent { color: #f97316; }

    .nav-links {
      display: flex;
      gap: 4px;
    }

    .nav-link {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #94a3b8;
      transition: all 0.2s;
      text-decoration: none;
    }
    .nav-link:hover, .nav-link.active {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* NOTIFICATION BELL */
    .bell-container {
      position: relative;
      cursor: pointer;
    }
    .bell-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #fff;
      font-size: 1.1rem;
      padding: 10px;
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
      border: none;
    }
    .bell-btn:hover {
      border-color: #f97316;
      background: rgba(249, 115, 22, 0.08);
    }
    .bell-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 50px;
      border: 2px solid #0f172a;
    }
    .notifications-dropdown {
      position: absolute;
      right: 0;
      top: 50px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      width: 320px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
      z-index: 2000;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .dropdown-header {
      padding: 14px 18px;
      font-weight: 700;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #334155;
      color: #94a3b8;
      background: rgba(0,0,0,0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mark-read-btn {
      background: transparent;
      border: none;
      color: #f97316;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .mark-read-btn:hover {
      background: rgba(249,115,22,0.1);
    }
    .dropdown-list {
      display: flex;
      flex-direction: column;
      max-height: 320px;
      overflow-y: auto;
    }
    .empty-notifications {
      padding: 24px;
      font-size: 0.82rem;
      color: #64748b;
      text-align: center;
    }
    .notification-item {
      padding: 12px 18px;
      font-size: 0.8rem;
      border-bottom: 1px solid #334155;
      color: #cbd5e1;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .notification-item.unread {
      background: rgba(249, 115, 22, 0.03);
      border-left: 3px solid #f97316;
    }
    .notification-item:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .noti-text {
      line-height: 1.4;
    }
    .noti-time {
      font-size: 0.68rem;
      color: #64748b;
      margin-top: 4px;
    }

    /* PREMIUM CART BUTTON */
    .cart-btn-new {
      position: relative;
      background: rgba(249, 115, 22, 0.12);
      border: 1px solid rgba(249, 115, 22, 0.25);
      border-radius: 14px;
      padding: 10px 16px;
      font-size: 1.15rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      color: #f97316;
    }
    .cart-btn-new:hover {
      background: rgba(249, 115, 22, 0.25);
      transform: scale(1.05);
    }
    .cart-badge-new {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #f97316;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 800;
      animation: bounce 0.3s ease;
      box-shadow: 0 4px 10px rgba(249, 115, 22, 0.4);
    }

    /* PROFILE DROPDOWN */
    .profile-container {
      position: relative;
      cursor: pointer;
    }
    .profile-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: #fff;
      font-size: 1.05rem;
      border: 2px solid #334155;
      transition: all 0.2s;
    }
    .profile-avatar:hover {
      border-color: #f97316;
      box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
    }
    .profile-dropdown {
      position: absolute;
      right: 0;
      top: 50px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      width: 210px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      z-index: 2000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .dropdown-link {
      padding: 12px 16px;
      font-size: 0.85rem;
      color: #cbd5e1;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
    }
    .dropdown-link:hover {
      background: rgba(255, 255, 255, 0.02);
      color: #f97316;
    }
    .text-danger { color: #f87171 !important; }
    .text-danger:hover { background: rgba(239, 68, 68, 0.05) !important; }

    .nav-link-login-gradient {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 15px rgba(249, 115, 22, 0.25);
      transition: all 0.2s;
    }
    .nav-link-login-gradient:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
    }

    /* FLOATING SUPPORT BUTTON */
    .floating-support-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      border: none;
      font-size: 1.4rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
      z-index: 999;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .floating-support-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 10px 28px rgba(249, 115, 22, 0.5);
    }

    .main-content {
      flex: 1;
      padding: 24px;
      background: #0f172a;
    }

    /* BOTTOM NAV */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 60px;
      background: rgba(30, 41, 59, 0.98);
      backdrop-filter: blur(10px);
      border-top: 1px solid #334155;
      z-index: 900;
      justify-content: space-around;
      align-items: center;
    }
    .bottom-nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #94a3b8;
      font-size: 0.72rem;
      font-weight: 500;
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      padding: 4px 12px;
      transition: all 0.2s;
    }
    .bottom-nav-link.active {
      color: #f97316;
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
      background: #f97316;
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

    /* CUSTOMER SUPPORT CHAT */
    .support-chat-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75);
      z-index: 2000; backdrop-filter: blur(8px);
      display: flex; justify-content: center; align-items: center; padding: 16px;
    }
    .support-chat-window {
      width: 100%; max-width: 460px; height: 600px; max-height: 85vh;
      background: #1e293b; border: 1px solid #334155; border-radius: 24px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
    }
    .chat-window-header {
      background: #0f172a; padding: 16px 20px; display: flex;
      justify-content: space-between; align-items: center; border-bottom: 1px solid #334155;
    }
    .header-user-info { display: flex; align-items: center; gap: 12px; }
    .chat-logo { font-size: 1.6rem; }
    .chat-title { font-size: 0.96rem; font-weight: 700; color: #fff; }
    .chat-subtitle { font-size: 0.76rem; color: #94a3b8; }
    .close-chat-btn {
      background: none; border: none; color: #94a3b8;
      font-size: 1.3rem; cursor: pointer; padding: 4px;
    }
    .close-chat-btn:hover { color: #f1f5f9; }
    .chat-history-body {
      flex: 1; overflow-y: auto; padding: 20px;
      background: #0f172a; display: flex; flex-direction: column; gap: 14px;
    }
    .chat-loading-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; color: #94a3b8;
    }
    .spinner-css {
      width: 32px; height: 32px; border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%; border-top-color: #f97316; animation: spin 0.8s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .chat-msg-row { display: flex; width: 100%; }
    .chat-msg-row.msg-sent { justify-content: flex-end; }
    .chat-msg-row.msg-received { justify-content: flex-start; }
    .chat-bubble {
      max-width: 78%; padding: 12px 16px; border-radius: 18px;
      position: relative; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); line-height: 1.45;
    }
    .msg-sent .chat-bubble {
      background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; border-bottom-right-radius: 4px;
    }
    .msg-received .chat-bubble {
      background: #334155; color: #cbd5e1; border-bottom-left-radius: 4px; border: 1px solid #475569;
    }
    .msg-text { font-size: 0.9rem; white-space: pre-wrap; word-break: break-word; text-align: left; }
    .msg-attachment { margin-top: 8px; border-radius: 10px; overflow: hidden; }
    .chat-img-attachment { max-width: 100%; max-height: 180px; object-fit: cover; display: block; border-radius: 8px; }
    .chat-file-attachment {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;
      background: rgba(255, 255, 255, 0.08); color: #60a5fa; text-decoration: none;
      border-radius: 8px; font-size: 0.8rem; font-weight: 600;
    }
    .msg-footer { display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 6px; font-size: 0.65rem; opacity: 0.8; }
    .msg-sent .msg-time { color: rgba(255, 255, 255, 0.85); }
    .msg-received .msg-time { color: #94a3b8; }
    .check-blue { color: #38bdf8; }
    .attach-preview-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 16px; background: rgba(0,0,0,0.2); border-top: 1px solid #334155;
    }
    .attach-preview-bar .file-name { font-size: 0.8rem; color: #f97316; font-weight: 600; }
    .clear-attach-btn { background: none; border: none; color: #ef4444; font-weight: 800; cursor: pointer; }
    .chat-window-input {
      display: flex; align-items: center; padding: 12px 18px;
      background: #0f172a; border-top: 1px solid #334155; gap: 12px;
    }
    .attach-file-btn {
      display: flex; align-items: center; justify-content: center;
      width: 42px; height: 42px; border-radius: 50%; background: #334155;
      border: 1px solid #475569; color: #cbd5e1; font-size: 1.25rem; cursor: pointer;
      transition: all 0.2s;
    }
    .attach-file-btn:hover { background: #475569; color: #fff; }
    .chat-input-field {
      flex: 1; background: #1e293b; border: 1px solid #334155;
      border-radius: 24px; padding: 10px 18px; color: #fff; font-size: 0.92rem; outline: none;
    }
    .chat-input-field:focus { border-color: #f97316; }
    .chat-send-btn {
      display: flex; align-items: center; justify-content: center;
      width: 42px; height: 42px; border-radius: 50%; background: #f97316;
      border: none; color: #fff; font-size: 1.15rem; cursor: pointer;
      transition: background 0.2s;
    }
    .chat-send-btn:disabled { background: #334155; color: #64748b; cursor: not-allowed; }

    @keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
    .animate-pop { animation: popScale 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes popScale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    @media (max-width: 640px) {
      .brand-name { font-size: 1.1rem; }
      .bottom-nav { display: flex; }
      .nav-links { display: none; }
      .cart-btn-new { display: none; }
      .navbar { padding: 0 16px; height: 64px; }
      .main-content { padding: 16px 16px 80px; }
      .bell-container { display: block; margin-right: 4px; }
      .profile-container { display: none; }
      .floating-support-btn { bottom: 80px; right: 16px; }
    }
  `]
})
export class ClientLayoutComponent implements OnInit, OnDestroy {

  get userInitial(): string {
    return (this.auth.user()?.name?.[0] ?? 'U').toUpperCase();
  }

  get isFooterHidden(): boolean {
    const url = this.router.url;
    return url.startsWith('/client/cart') || url.startsWith('/client/orders') || url.startsWith('/client/profile');
  }

  showNotifications = signal<boolean>(false);
  showUserMenu = signal<boolean>(false);
  notifications = signal<NotificationItem[]>([]);

  activeTicket: any = null;
  supportMessages: any[] = [];
  supportMessageInput = '';
  isSupportLoading = false;
  supportAttachmentUrl: string | null = null;
  supportAttachmentName: string | null = null;
  supportPollingInterval: any = null;
  isUploadingAttachment = false;

  private orderPollInterval: any = null;

  unreadCount = computed(() => this.notifications().filter(n => !n.seen).length);

  constructor(
    public auth: AuthService,
    public cart: CartService,
    private router: Router,
    private orderService: OrderService,
    private snack: MatSnackBar
  ) {
    // Close dropdowns on window click
    window.addEventListener('click', () => {
      this.showNotifications.set(false);
      this.showUserMenu.set(false);
    });

    // Start/Stop polling on login changes
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.loadNotifications();
        this.pollOrders();
        if (!this.orderPollInterval) {
          this.orderPollInterval = setInterval(() => this.pollOrders(), 5000);
        }
      } else {
        this.stopOrderPolling();
        this.notifications.set([]);
      }
    });

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

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.loadNotifications();
      this.pollOrders();
      this.orderPollInterval = setInterval(() => this.pollOrders(), 5000);
    }
  }

  ngOnDestroy(): void {
    this.stopOrderPolling();
    this.stopSupportPolling();
  }

  stopOrderPolling(): void {
    if (this.orderPollInterval) {
      clearInterval(this.orderPollInterval);
      this.orderPollInterval = null;
    }
  }

  loadNotifications(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const cached = localStorage.getItem(`mango_notifications_${userId}`);
    if (cached) {
      this.notifications.set(JSON.parse(cached));
    } else {
      this.notifications.set([]);
    }
  }

  saveNotifications(list: NotificationItem[]): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    localStorage.setItem(`mango_notifications_${userId}`, JSON.stringify(list));
    this.notifications.set([...list]);
  }

  pollOrders(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        let changed = false;
        const currentNotifications = [...this.notifications()];
        const lastStatusCacheKey = `mango_orders_last_status_${userId}`;
        const lastStatusMapStr = localStorage.getItem(lastStatusCacheKey);
        const lastStatusMap: Record<number, { status: string; isReady: boolean }> = lastStatusMapStr ? JSON.parse(lastStatusMapStr) : {};

        orders.forEach(o => {
          const cached = lastStatusMap[o.id];
          if (!cached) {
            const text = `Buyurtmangiz qabul qilindi. Tasdiqlash kutilmoqda 🍔 (Buyurtma #${o.id})`;
            currentNotifications.unshift({
              id: `order_${o.id}_PENDING_${Date.now()}`,
              text,
              createdAt: Date.now(),
              seen: false,
              orderId: o.id,
              status: 'PENDING'
            });
            lastStatusMap[o.id] = { status: o.status, isReady: !!o.isReady };
            changed = true;
          } else {
            if (cached.status !== o.status) {
              const text = this.getStatusChangeText(o.id, o.status);
              currentNotifications.unshift({
                id: `order_${o.id}_${o.status}_${Date.now()}`,
                text,
                createdAt: Date.now(),
                seen: false,
                orderId: o.id,
                status: o.status
              });
              cached.status = o.status;
              changed = true;
            }
            if (!cached.isReady && o.isReady && o.status === 'PREPARING') {
              currentNotifications.unshift({
                id: `order_${o.id}_READY_${Date.now()}`,
                text: `Buyurtmangiz tayyor bo'ldi! Kuryer kutilmoqda 📦 (Buyurtma #${o.id})`,
                createdAt: Date.now(),
                seen: false,
                orderId: o.id,
                status: 'READY'
              });
              cached.isReady = true;
              changed = true;
            }
          }
        });

        if (changed) {
          localStorage.setItem(lastStatusCacheKey, JSON.stringify(lastStatusMap));
          currentNotifications.sort((a, b) => b.createdAt - a.createdAt);
          this.saveNotifications(currentNotifications);
          this.playChime();
        }
      }
    });
  }

  getStatusChangeText(orderId: number, status: string): string {
    switch (status) {
      case 'PENDING': return `Buyurtmangiz qabul qilindi. Tasdiqlash kutilmoqda 🍔 (Buyurtma #${orderId})`;
      case 'PREPARING': return `Restoran buyurtmangizni tayyorlashni boshladi 🍳 (Buyurtma #${orderId})`;
      case 'COURIER_ACCEPTED': return `Kuryer buyurtmangizni qabul qildi 🏍️ (Buyurtma #${orderId})`;
      case 'COURIER_AT_RESTAURANT': return `Kuryer restoranga yetib keldi 🏪 (Buyurtma #${orderId})`;
      case 'DELIVERING': return `Kuryer buyurtmangizni olib, yo'lga chiqdi 🚴 (Buyurtma #${orderId})`;
      case 'COURIER_AT_CLIENT': return `Kuryer buyurtmangizni yetkazish uchun yaqinlashmoqda! 📍 (Buyurtma #${orderId})`;
      case 'DELIVERED': return `Buyurtmangiz muvaffaqiyatli yetkazildi! Yoqimli ishtaha 🎉 (Buyurtma #${orderId})`;
      case 'CANCELED': return `Buyurtmangiz bekor qilindi 🚫 (Buyurtma #${orderId})`;
      default: return `Buyurtmangiz holati: ${status} (Buyurtma #${orderId})`;
    }
  }

  markAllAsRead(): void {
    const list = this.notifications().map(n => ({ ...n, seen: true }));
    this.saveNotifications(list);
  }

  markAsRead(item: NotificationItem): void {
    const updated = this.notifications().map(n => {
      if (n.id === item.id) {
        return { ...n, seen: true };
      }
      return n;
    });
    this.saveNotifications(updated);
  }

  playChime(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); 
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); 
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.log('AudioContext could not start:', e);
    }
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
    const userId = this.auth.user()?.id;
    this.orderService.getTicketMessages(ticketId).subscribe({
      next: (msgs) => {
        this.isSupportLoading = false;

        if (userId) {
          const lastMsgIdKey = `mango_last_seen_msg_${userId}_${ticketId}`;
          const lastSeenMsgId = Number(localStorage.getItem(lastMsgIdKey) || '0');
          let maxId = lastSeenMsgId;
          let newAdminMsgDetected = false;

          msgs.forEach((m: any) => {
            if (m.id > lastSeenMsgId) {
              if (m.id > maxId) maxId = m.id;
              if (m.senderType === 'admin') {
                newAdminMsgDetected = true;
                const currentNotifications = [...this.notifications()];
                currentNotifications.unshift({
                  id: `support_${m.id}`,
                  text: `Yordam markazidan yangi xabar: "${m.message}" 💬`,
                  createdAt: Date.now(),
                  seen: false
                });
                this.saveNotifications(currentNotifications);
              }
            }
          });

          if (newAdminMsgDetected) {
            localStorage.setItem(lastMsgIdKey, maxId.toString());
            this.playChime();
          }
        }

        this.supportMessages = msgs;
        this.orderService.markMessagesAsSeen(ticketId).subscribe();
        setTimeout(() => this.scrollToChatBottom(), 100);
      },
      error: () => this.isSupportLoading = false
    });
  }

  startSupportPolling(ticketId: number): void {
    const userId = this.auth.user()?.id;
    this.stopSupportPolling();
    this.supportPollingInterval = setInterval(() => {
      this.orderService.getTicketMessages(ticketId).subscribe({
        next: (msgs) => {
          if (msgs.length !== this.supportMessages.length || JSON.stringify(msgs) !== JSON.stringify(this.supportMessages)) {
            if (userId) {
              const lastMsgIdKey = `mango_last_seen_msg_${userId}_${ticketId}`;
              const lastSeenMsgId = Number(localStorage.getItem(lastMsgIdKey) || '0');
              let maxId = lastSeenMsgId;
              let newAdminMsgDetected = false;

              msgs.forEach((m: any) => {
                if (m.id > lastSeenMsgId) {
                  if (m.id > maxId) maxId = m.id;
                  if (m.senderType === 'admin') {
                    newAdminMsgDetected = true;
                    const currentNotifications = [...this.notifications()];
                    currentNotifications.unshift({
                      id: `support_${m.id}`,
                      text: `Yordam markazidan xabar: "${m.message}" 💬`,
                      createdAt: Date.now(),
                      seen: false
                    });
                    this.saveNotifications(currentNotifications);
                  }
                }
              });

              if (newAdminMsgDetected) {
                localStorage.setItem(lastMsgIdKey, maxId.toString());
                this.playChime();
              }
            }

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
