import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="admin-layout">
      <!-- Mobile header -->
      <header class="mobile-header">
        <button class="menu-toggle" (click)="menuOpen.set(!menuOpen())">
          {{ menuOpen() ? '✕' : '☰' }}
        </button>
        <div class="mobile-logo">
          <span>🍽️</span>
          <span style="font-weight: 800; color: var(--text)">Admin<span style="color: var(--primary)">Panel</span></span>
        </div>
        <button class="logout-btn-mob" (click)="auth.logout()">🚪</button>
      </header>

      <!-- Sidebar (Drawer on mobile, stationary on desktop) -->
      <aside class="sidebar" [class.open]="menuOpen()">
        <div class="sidebar-logo">
          <span>🍽️</span>
          <span class="logo-text">Admin</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-dashboard">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-orders">
            <span class="nav-icon">📋</span>
            <span>Buyurtmalar</span>
          </a>
          <a routerLink="/admin/restaurants" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-restaurants">
            <span class="nav-icon">🏪</span>
            <span>Restoranlar</span>
          </a>
          <a routerLink="/admin/menu" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-menu">
            <span class="nav-icon">🍕</span>
            <span>Menyu</span>
          </a>
          <a routerLink="/admin/couriers" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-couriers">
            <span class="nav-icon">🏍️</span>
            <span>Kuryerlar</span>
          </a>
          <a routerLink="/admin/clients" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-clients">
            <span class="nav-icon">👥</span>
            <span>Mijozlar</span>
          </a>
          <a routerLink="/admin/managers" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-managers">
            <span class="nav-icon">👤</span>
            <span>Menejerlar</span>
          </a>
          <a routerLink="/admin/slots" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="admin-nav-slots">
            <span class="nav-icon">⏰</span>
            <span>Smenalar</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ initial }}</div>
            <div>
              <p class="user-name">{{ auth.user()?.name }}</p>
              <p class="user-role">{{ auth.user()?.role }}</p>
            </div>
          </div>
          <button class="logout-btn" (click)="auth.logout()" id="admin-logout">
            🚪
          </button>
        </div>
      </aside>

      <!-- Mobile drawer overlay -->
      @if (menuOpen()) {
        <div class="mobile-overlay" (click)="menuOpen.set(false)"></div>
      }

      <!-- Main content area -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }

    .mobile-header {
      display: none;
      height: 56px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 0 16px;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 120;
    }

    .menu-toggle {
      background: none;
      border: none;
      color: var(--text);
      font-size: 1.6rem;
      cursor: pointer;
    }

    .mobile-logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.1rem;
    }

    .logout-btn-mob {
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
    }

    .sidebar {
      width: 240px;
      background: var(--bg-card);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 20px 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 20px 24px;
      font-size: 1.3rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }
    .logo-text { font-size: 1.1rem; font-weight: 800; color: var(--text); }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 12px;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius);
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: var(--transition);
    }
    .nav-item:hover, .nav-item.active {
      background: rgba(249,115,22,0.1);
      color: var(--primary);
    }
    .nav-item.active { border-left: 3px solid var(--primary); padding-left: 13px; }

    .nav-icon { font-size: 1.1rem; }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .user-info { display: flex; align-items: center; gap: 10px; overflow: hidden; }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 0.7rem;
      color: var(--primary);
      font-weight: 600;
    }

    .logout-btn {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 1rem;
      transition: var(--transition);
      flex-shrink: 0;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.25); }

    .main-content {
      flex: 1;
      padding: 28px;
      overflow-y: auto;
    }

    .mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 125;
    }

    @media (max-width: 768px) {
      .mobile-header { display: flex; }
      .admin-layout { flex-direction: column; }
      
      .sidebar {
        position: fixed;
        left: -240px;
        top: 0;
        z-index: 130;
        height: 100vh;
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 10px 0 40px rgba(0,0,0,0.5);
      }
      .sidebar.open { left: 0; }
      
      .main-content {
        padding: 20px 16px;
      }
    }
  `]
})
export class AdminLayoutComponent {
  menuOpen = signal(false);

  get initial(): string {
    return (this.auth.user()?.name?.[0] ?? 'A').toUpperCase();
  }
  constructor(public auth: AuthService) {}
}
