import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="dashboard-page animate-in">
      <div class="page-header">
        <h1 class="page-title">📊 Admin Dashboard</h1>
        <p style="color: var(--text-muted);">Tizim umumiy holati</p>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card" style="border-color: rgba(245,158,11,0.3)">
          <div class="stat-icon">⏳</div>
          <div class="stat-number" style="color: #f59e0b">{{ stats()['pending'] ?? 0 }}</div>
          <div class="stat-label">Kutilmoqda</div>
        </div>
        <div class="stat-card" style="border-color: rgba(139,92,246,0.3)">
          <div class="stat-icon">🍳</div>
          <div class="stat-number" style="color: #8b5cf6">{{ stats()['preparing'] ?? 0 }}</div>
          <div class="stat-label">Tayyorlanmoqda</div>
        </div>
        <div class="stat-card" style="border-color: rgba(249,115,22,0.3)">
          <div class="stat-icon">🏍️</div>
          <div class="stat-number" style="color: #f97316">{{ stats()['delivering'] ?? 0 }}</div>
          <div class="stat-label">Yetkazilmoqda</div>
        </div>
        <div class="stat-card" style="border-color: rgba(16,185,129,0.3)">
          <div class="stat-icon">✅</div>
          <div class="stat-number" style="color: #10b981">{{ stats()['delivered'] ?? 0 }}</div>
          <div class="stat-label">Yetkazildi</div>
        </div>
        <div class="stat-card" style="border-color: rgba(59,130,246,0.3)">
          <div class="stat-icon">📦</div>
          <div class="stat-number" style="color: #3b82f6">{{ stats()['total'] ?? 0 }}</div>
          <div class="stat-label">Jami buyurtmalar</div>
        </div>
      </div>

      <!-- Quick links -->
      <h2 class="section-title">⚡ Tezkor harakatlar</h2>
      <div class="quick-links">
        <a routerLink="/admin/orders" class="quick-card" id="admin-quick-orders">
          <span class="quick-icon">📋</span>
          <span class="quick-title">Buyurtmalarni boshqarish</span>
          <span class="quick-desc">Barcha buyurtmalarni ko'rish, holat o'zgartirish</span>
          <span class="quick-arrow">→</span>
        </a>
        <a routerLink="/admin/menu" class="quick-card" id="admin-quick-menu">
          <span class="quick-icon">🍕</span>
          <span class="quick-title">Menyu boshqaruvi</span>
          <span class="quick-desc">Taom qo'shish, o'zgartirish, o'chirish</span>
          <span class="quick-arrow">→</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { max-width: 1000px; }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
    }
    .stat-icon { font-size: 1.8rem; margin-bottom: 4px; }
    .stat-number { font-size: 2.2rem; font-weight: 800; }
    .stat-label { font-size: 0.8rem; color: var(--text-muted); }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 28px 0 16px;
    }

    .quick-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .quick-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: grid;
      grid-template-areas:
        "icon arrow"
        "title title"
        "desc desc";
      grid-template-columns: 1fr auto;
      gap: 4px;
      text-decoration: none;
      transition: var(--transition);
    }
    .quick-card:hover {
      border-color: var(--primary);
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(249,115,22,0.15);
    }

    .quick-icon {
      grid-area: icon;
      font-size: 2rem;
      display: block;
      margin-bottom: 8px;
    }
    .quick-arrow {
      grid-area: arrow;
      align-self: start;
      color: var(--primary);
      font-size: 1.3rem;
      font-weight: 700;
    }
    .quick-title {
      grid-area: title;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      display: block;
    }
    .quick-desc {
      grid-area: desc;
      font-size: 0.8rem;
      color: var(--text-muted);
      display: block;
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats = signal<Record<string, number>>({});
  private pollInterval: any;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadStats();
    this.pollInterval = setInterval(() => this.loadStats(), 4000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  loadStats(): void {
    this.orderService.getStats().subscribe(s => this.stats.set(s));
  }
}
