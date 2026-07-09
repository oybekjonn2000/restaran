import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CartSidebarComponent } from '../cart/cart-sidebar.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, CartSidebarComponent],
  template: `
    <div class="client-layout">
      <!-- Navbar -->
      <nav class="navbar">
        <div class="nav-brand">
          <span class="logo">🍽️</span>
          <span class="brand-name">Food<span class="accent">Delivery</span></span>
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
          <!-- Cart button -->
          <button class="cart-btn" (click)="cartOpen.set(true)" id="cart-toggle-btn">
            🛒
            @if (cart.totalItems() > 0) {
              <span class="cart-badge">{{ cart.totalItems() }}</span>
            }
          </button>

          <!-- User info -->
          @if (auth.isLoggedIn()) {
            <div class="user-chip">
              <span class="user-avatar">{{ userInitial }}</span>
              <span class="user-name">{{ (auth.user()?.name ?? '') | slice:0:10 }}</span>
            </div>
            <button class="logout-btn" (click)="auth.logout()" title="Chiqish" id="logout-btn">
              🚪
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
        <button class="bottom-nav-link" (click)="cartOpen.set(true)" id="mob-nav-cart">
          <span class="bottom-nav-icon">
            🛒
            @if (cart.totalItems() > 0) {
              <span class="bottom-nav-badge">{{ cart.totalItems() }}</span>
            }
          </span>
          <span class="bottom-nav-text">Savat</span>
        </button>
      </div>

      <!-- Cart sidebar -->
      <app-cart-sidebar
        [isOpen]="cartOpen()"
        (closed)="cartOpen.set(false)">
      </app-cart-sidebar>

      <!-- Overlay -->
      @if (cartOpen()) {
        <div class="overlay" (click)="cartOpen.set(false)"></div>
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
  `]
})
export class ClientLayoutComponent {
  cartOpen = signal(false);

  get userInitial(): string {
    return (this.auth.user()?.name?.[0] ?? 'U').toUpperCase();
  }

  constructor(public auth: AuthService, public cart: CartService) {}
}
