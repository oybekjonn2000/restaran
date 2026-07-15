import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { Restaurant } from '../../../core/models/restaurant.model';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <div class="manager-layout">
      <!-- Mobile header -->
      <header class="mobile-header">
        <button class="menu-toggle" (click)="menuOpen.set(!menuOpen())">
          {{ menuOpen() ? '✕' : '☰' }}
        </button>
        <div class="mobile-logo">
          @if (myRestaurants().length > 1) {
            <select [ngModel]="selectedRestaurantId()" (ngModelChange)="onRestaurantChange($event)" class="restaurant-select-mob">
              @for (r of myRestaurants(); track r.id) {
                <option [value]="r.id">{{ r.name }}</option>
              }
            </select>
          } @else {
            <span>🏪</span>
            <span style="font-weight: 800; color: var(--text)">{{ restaurant()?.name || 'Menejer' }}</span>
          }
        </div>
        <button class="logout-btn-mob" (click)="auth.logout()" style="display: flex; align-items: center; justify-content: center;"><span class="material-icons" style="font-size: 20px; color: #ef4444;">logout</span></button>
      </header>

      <!-- Sidebar (Drawer on mobile, stationary on desktop) -->
      <aside class="sidebar" [class.open]="menuOpen()">
        <div class="sidebar-logo">
          <span>🏪</span>
          <span class="logo-text">Menejerlik</span>
        </div>

        @if (myRestaurants().length > 1) {
          <div class="restaurant-selector-container">
            <label class="selector-lbl">Faol Restoran:</label>
            <select [ngModel]="selectedRestaurantId()" (ngModelChange)="onRestaurantChange($event)" class="restaurant-select">
              @for (r of myRestaurants(); track r.id) {
                <option [value]="r.id">{{ r.name }}</option>
              }
            </select>
          </div>
        }

        <nav class="sidebar-nav">
          <a routerLink="/manager/dashboard" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="manager-nav-dashboard">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/manager/menu" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="manager-nav-menu">
            <span class="nav-icon">🍕</span>
            <span>Taomlar Menyu</span>
          </a>
          <a routerLink="/manager/categories" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="manager-nav-categories">
            <span class="nav-icon">📁</span>
            <span>Toifalar (Kategoriyalar)</span>
          </a>
          <a routerLink="/manager/profile" routerLinkActive="active" (click)="menuOpen.set(false)"
             class="nav-item" id="manager-nav-profile">
            <span class="nav-icon">⚙️</span>
            <span>Restoran Profili</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">👤</div>
            <div>
              <p class="user-name">{{ auth.user()?.name }}</p>
              <p class="user-role">Menejer</p>
            </div>
          </div>
          <button class="logout-btn" (click)="auth.logout()" id="manager-logout" style="display: flex; align-items: center; justify-content: center; padding: 8px;">
            <span class="material-icons" style="font-size: 20px; color: #ef4444;">logout</span>
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
    .manager-layout {
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
    .logo-text { font-size: 1rem; font-weight: 800; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}

    .restaurant-selector-container {
      padding: 0 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }
    .selector-lbl {
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .restaurant-select {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 10px;
      outline: none;
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      width: 100%;
      transition: var(--transition);
    }
    .restaurant-select:focus {
      border-color: var(--primary);
    }

    .restaurant-select-mob {
      background: var(--bg-card2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 8px;
      outline: none;
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      max-width: 180px;
    }

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
      .manager-layout { flex-direction: column; }
      
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
export class ManagerLayoutComponent implements OnInit {
  menuOpen = signal(false);
  restaurant = signal<Restaurant | null>(null);
  myRestaurants = signal<Restaurant[]>([]);
  selectedRestaurantId = signal<number | null>(null);

  constructor(public auth: AuthService, private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.orderService.getManagerRestaurants().subscribe({
      next: (data) => {
        this.myRestaurants.set(data);
        if (data.length > 0) {
          const storedId = localStorage.getItem('manager_active_restaurant_id');
          const found = data.find(r => r.id.toString() === storedId);
          if (found) {
            this.selectedRestaurantId.set(found.id);
            this.restaurant.set(found);
          } else {
            this.selectedRestaurantId.set(data[0].id);
            this.restaurant.set(data[0]);
            localStorage.setItem('manager_active_restaurant_id', data[0].id.toString());
          }
        }
      },
      error: () => console.warn('Could not fetch restaurants list for manager')
    });
  }

  onRestaurantChange(id: any): void {
    const numId = Number(id);
    localStorage.setItem('manager_active_restaurant_id', numId.toString());
    this.selectedRestaurantId.set(numId);
    const found = this.myRestaurants().find(r => r.id === numId);
    if (found) {
      this.restaurant.set(found);
    }
    // Reload page to refresh all active subcomponents' data
    window.location.reload();
  }
}
