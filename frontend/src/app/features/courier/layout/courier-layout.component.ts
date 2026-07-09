import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-courier-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div style="min-height: 100vh; display: flex; flex-direction: column;">
      <nav class="navbar">
        <div class="nav-brand">
          <span>🏍️</span>
          <span class="brand-name">Kuryer <span class="accent">Panel</span></span>
        </div>
        <div class="user-info">
          <span class="user-chip">👤 {{ auth.user()?.name }}</span>
          <button class="logout-btn" (click)="auth.logout()" id="courier-logout">🚪 Chiqish</button>
        </div>
      </nav>
      <main style="flex: 1; padding: 24px;">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(30,41,59,0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      padding: 0 24px; height: 64px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .nav-brand { display: flex; align-items: center; gap: 8px; font-size: 1.3rem; }
    .brand-name { font-size: 1.1rem; font-weight: 800; color: var(--text); }
    .accent { color: #8b5cf6; }
    .user-info { display: flex; align-items: center; gap: 12px; }
    .user-chip {
      background: var(--bg-card2); border: 1px solid var(--border);
      border-radius: 20px; padding: 6px 14px; font-size: 0.875rem;
    }
    .logout-btn {
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px; padding: 8px 14px; cursor: pointer; font-size: 0.875rem;
      font-family: 'Poppins', sans-serif; color: #ef4444; transition: var(--transition);
    }
    .logout-btn:hover { background: rgba(239,68,68,0.2); }
  `]
})
export class CourierLayoutComponent {
  constructor(public auth: AuthService) {}
}
